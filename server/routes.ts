import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db";
import { foods, exercises, userProfiles, foodEntries, workoutEntries, insertUserProfileSchema, insertFoodEntrySchema, insertWorkoutEntrySchema } from "@shared/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

const apiKey = process.env.GEMINI_API_KEY?.trim();
console.log('[Gemini] API Key configured:', apiKey ? `${apiKey.substring(0, 7)}...` : 'MISSING');

const genAI = new GoogleGenerativeAI(apiKey || "");

// Helper function to extract and parse JSON from Gemini response
const extractBalancedJSON = (text: string): string | null => {
  let searchIdx = 0;
  
  while (true) {
    const startIdx = text.indexOf('{', searchIdx);
    if (startIdx === -1) return null;
    
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = startIdx; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const candidate = text.substring(startIdx, i + 1);
            try {
              const parsed = JSON.parse(candidate);
              if (parsed.bodyFatPercentage !== undefined) {
                return candidate;
              }
            } catch {
              // This candidate didn't work, try next one
            }
            searchIdx = i + 1;
            break;
          }
        }
      }
    }
    
    if (braceCount !== 0) return null;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Body fat analysis with Gemini Vision (multi-angle + calibration)
  app.post("/api/analyze-body-fat", async (req, res) => {
    try {
      const { images, age, height, weight, gender, manualMeasurements } = req.body;

      if (!images || !Array.isArray(images) || images.length < 2 || !age || !height || !weight || !gender) {
        return res.status(400).json({ error: "É necessário enviar pelo menos 2 fotos (frontal e lateral)" });
      }

      // Calculate BMI and body metrics
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      
      // Create advanced scientific prompt
      const angles = images.map((img: any) => img.angle);
      const prompt = `Você é um especialista certificado em análise de composição corporal e antropometria. Realize uma análise científica PROGRESSIVA das imagens fornecidas.

DADOS ANTROPOMÉTRICOS:
- Gênero: ${gender === 'male' ? 'Masculino' : 'Feminino'}
- Idade: ${age} anos
- Altura: ${height} cm
- Peso: ${weight} kg
- IMC: ${bmi.toFixed(1)} kg/m²

ÂNGULOS DAS FOTOS FORNECIDAS: ${angles.join(', ')}

METODOLOGIA DE ANÁLISE PROGRESSIVA (execute sequencialmente):

ETAPA 1 - CLASSIFICAÇÃO DO TIPO CORPORAL:
Identifique o somatótipo predominante (ectomorfo/mesomorfo/endomorfo) observando:
- Estrutura óssea e largura dos ombros em relação ao quadril
- Distribuição de massa visível (músculo vs gordura)
- Proporções corporais gerais

ETAPA 2 - LANDMARKS ANATÔMICOS (analise cada região):
a) Região Abdominal:
   - Visibilidade dos músculos reto abdominal e oblíquos
   - Presença/ausência de definição em "six-pack"
   - Espessura da camada adiposa subcutânea na cintura
   
b) Membros Superiores:
   - Definição do deltóide anterior/lateral/posterior
   - Separação entre bíceps e tríceps
   - Visibilidade de veias (vasculatura) nos antebraços

c) Região Torácica:
   - Definição peitoral e presença de sulco intermamário
   - Gordura na região axilar

d) Membros Inferiores (se visível):
   - Separação entre vasto medial, lateral e reto femoral
   - Definição dos glúteos
   - Presença de gordura em coxas internas

ETAPA 3 - ANÁLISE ANGULAR ESPECÍFICA:
${angles.includes('frontal') ? '- FRONTAL: Avalie simetria, definição abdominal central, linha da cintura' : ''}
${angles.includes('lateral') ? '- LATERAL (PERFIL): Avalie curvatura lombar, espessura abdominal anterior, definição oblíqua' : ''}
${angles.includes('costas') ? '- COSTAS: Avalie definição dorsal (trapézio, latíssimo), gordura lombar inferior' : ''}

ETAPA 4 - INTEGRAÇÃO COM DADOS ANTROPOMÉTRICOS:
- Compare achados visuais com IMC ${bmi.toFixed(1)}
- ${gender === 'male' ? 'Homens: IMC alto + definição = massa muscular; IMC alto sem definição = gordura' : 'Mulheres: Considere distribuição ginóide natural, padrões hormonais'}
- Ajuste estimativa considerando idade ${age} anos (metabolismo, elasticidade da pele)

ETAPA 5 - CALIBRAÇÃO COM FAIXAS CIENTÍFICAS:
Homens: Essencial (2-5%), Atlético (6-13%), Fitness (14-17%), Média (18-24%), Sobrepeso (25-31%), Obeso (>32%)
Mulheres: Essencial (10-13%), Atlética (14-20%), Fitness (21-24%), Média (25-31%), Sobrepeso (32-38%), Obesa (>39%)

SAÍDA OBRIGATÓRIA EM JSON:
{
  "bodyFatPercentage": [número decimal preciso entre 5-40, baseado nas 5 etapas],
  "confidence": [0.7-0.95, maior quando múltiplos ângulos concordam],
  "reasoning": "Resumo: Tipo corporal identificado. Landmarks chave observados. Concordância entre ângulos. Integração com IMC. Faixa final justificada."
}`;

      // Prepare images for Gemini
      const imageParts = images.map((img: any) => {
        const base64Data = img.data.split(',')[1];
        const mimeType = img.data.split(';')[0].split(':')[1];
        return {
          inlineData: {
            mimeType,
            data: base64Data
          }
        };
      });

      // Get Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Generate content with all images
      const result = await model.generateContent([
        prompt,
        ...imageParts
      ]);

      const response = await result.response;
      let text = await response.text();
      
      // Extract JSON from Gemini response
      let jsonText = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      jsonText = extractBalancedJSON(jsonText) || '';
      
      if (!jsonText) {
        console.error("No valid JSON object found in Gemini response:", text);
        return res.status(502).json({ 
          error: "Resposta da IA em formato inválido. Tente novamente." 
        });
      }
      
      // Parse and validate the JSON response
      let analysis;
      try {
        analysis = JSON.parse(jsonText);
        
        // Validate bodyFatPercentage
        if (typeof analysis.bodyFatPercentage !== 'number' || 
            analysis.bodyFatPercentage < 0 || 
            analysis.bodyFatPercentage > 100) {
          throw new Error('Invalid bodyFatPercentage');
        }
        
        // Validate and normalize confidence
        if (analysis.confidence !== undefined) {
          const conf = typeof analysis.confidence === 'string' 
            ? parseFloat(analysis.confidence) 
            : analysis.confidence;
          
          if (!Number.isFinite(conf) || conf < 0 || conf > 1) {
            throw new Error('Invalid confidence');
          }
          analysis.confidence = conf;
        } else {
          analysis.confidence = 0.8; // Higher default for multi-angle
        }
        
        // Validate reasoning
        if (analysis.reasoning !== undefined) {
          if (typeof analysis.reasoning !== 'string' || analysis.reasoning.trim() === '') {
            throw new Error('Invalid reasoning');
          }
        } else {
          analysis.reasoning = 'Análise baseada em múltiplos ângulos e landmarks anatômicos';
        }
        
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", jsonText, parseError);
        return res.status(502).json({ 
          error: "Erro ao processar resposta da IA. Tente novamente." 
        });
      }
      
      // COMBINATION STEP: Calibrate AI result with manual measurements if available
      let combinedEstimate = analysis.bodyFatPercentage;
      
      if (manualMeasurements?.neck && manualMeasurements?.waist) {
        const neck = parseFloat(manualMeasurements.neck);
        const waist = parseFloat(manualMeasurements.waist);
        
        if (neck > 0 && waist > 0) {
          // Calculate manual body fat using Deurenberg + US Navy
          const deurenbergBF = 1.20 * bmi + 0.23 * age - 10.8 * (gender === 'male' ? 1 : 0) - 5.4;
          
          let navyBF = 0;
          if (gender === 'male') {
            const log10WaistNeck = Math.log10(waist - neck);
            const log10Height = Math.log10(height);
            navyBF = 495 / (1.0324 - 0.19077 * log10WaistNeck + 0.15456 * log10Height) - 450;
          } else {
            navyBF = (waist * 0.74 - neck * 0.082 - 34.89) / height * 100;
          }
          
          const manualBF = (deurenbergBF + navyBF) / 2;
          
          // Weighted combination: 60% AI (visual) + 40% Manual (measurements)
          // AI is weighted more because multi-angle photos provide comprehensive view
          combinedEstimate = (analysis.bodyFatPercentage * 0.6) + (manualBF * 0.4);
          
          console.log(`AI: ${analysis.bodyFatPercentage.toFixed(1)}%, Manual: ${manualBF.toFixed(1)}%, Combined: ${combinedEstimate.toFixed(1)}%`);
        }
      }
      
      console.log("AI Body Fat Analysis (Gemini Multi-Angle):", analysis);

      res.json({
        bodyFatPercentage: analysis.bodyFatPercentage,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        combinedEstimate: parseFloat(combinedEstimate.toFixed(1))
      });
    } catch (error) {
      console.error("Error analyzing body fat:", error);
      res.status(500).json({ error: "Erro ao analisar imagens" });
    }
  });

  // Seed database with initial food and exercise data
  async function seedDatabase() {
    try {
      const foodCount = await db.select().from(foods);
      const exerciseCount = await db.select().from(exercises);

      if (foodCount.length === 0) {
        console.log('Seeding foods database...');
        await db.insert(foods).values([
          // Proteínas
          { name: 'Peito de Frango Grelhado', category: 'Proteína', calories: 165, portion: 100, protein: 31, carbs: 0, fat: 3.6 },
          { name: 'Filé de Tilápia', category: 'Proteína', calories: 96, portion: 100, protein: 20, carbs: 0, fat: 1.7 },
          { name: 'Atum em Lata (água)', category: 'Proteína', calories: 116, portion: 100, protein: 26, carbs: 0, fat: 0.8 },
          { name: 'Ovo Cozido', category: 'Proteína', calories: 155, portion: 100, protein: 13, carbs: 1.1, fat: 11 },
          { name: 'Peito de Peru', category: 'Proteína', calories: 111, portion: 100, protein: 24, carbs: 0.5, fat: 1.7 },
          { name: 'Carne Moída (patinho)', category: 'Proteína', calories: 176, portion: 100, protein: 21, carbs: 0, fat: 10 },
          { name: 'Salmão', category: 'Proteína', calories: 208, portion: 100, protein: 20, carbs: 0, fat: 13 },
          
          // Carboidratos
          { name: 'Arroz Branco Cozido', category: 'Carboidrato', calories: 130, portion: 100, protein: 2.7, carbs: 28, fat: 0.3 },
          { name: 'Arroz Integral Cozido', category: 'Carboidrato', calories: 112, portion: 100, protein: 2.6, carbs: 24, fat: 0.9 },
          { name: 'Batata Doce Cozida', category: 'Carboidrato', calories: 86, portion: 100, protein: 1.6, carbs: 20, fat: 0.1 },
          { name: 'Macarrão Integral', category: 'Carboidrato', calories: 124, portion: 100, protein: 5.3, carbs: 26, fat: 0.5 },
          { name: 'Pão Integral', category: 'Carboidrato', calories: 247, portion: 100, protein: 13, carbs: 41, fat: 3.4 },
          { name: 'Aveia', category: 'Carboidrato', calories: 389, portion: 100, protein: 17, carbs: 66, fat: 6.9 },
          { name: 'Tapioca', category: 'Carboidrato', calories: 358, portion: 100, protein: 0.6, carbs: 88, fat: 0.2 },
          
          // Vegetais
          { name: 'Brócolis Cozido', category: 'Vegetal', calories: 35, portion: 100, protein: 2.4, carbs: 7, fat: 0.4 },
          { name: 'Alface', category: 'Vegetal', calories: 14, portion: 100, protein: 1.4, carbs: 2.9, fat: 0.1 },
          { name: 'Tomate', category: 'Vegetal', calories: 18, portion: 100, protein: 0.9, carbs: 3.9, fat: 0.2 },
          { name: 'Cenoura', category: 'Vegetal', calories: 41, portion: 100, protein: 0.9, carbs: 10, fat: 0.2 },
          { name: 'Abobrinha', category: 'Vegetal', calories: 17, portion: 100, protein: 1.2, carbs: 3.1, fat: 0.3 },
          
          // Frutas
          { name: 'Banana', category: 'Fruta', calories: 89, portion: 100, protein: 1.1, carbs: 23, fat: 0.3 },
          { name: 'Maçã', category: 'Fruta', calories: 52, portion: 100, protein: 0.3, carbs: 14, fat: 0.2 },
          { name: 'Morango', category: 'Fruta', calories: 32, portion: 100, protein: 0.7, carbs: 7.7, fat: 0.3 },
          { name: 'Abacate', category: 'Fruta', calories: 160, portion: 100, protein: 2, carbs: 8.5, fat: 15 },
          { name: 'Mamão', category: 'Fruta', calories: 43, portion: 100, protein: 0.5, carbs: 11, fat: 0.3 },
          
          // Lanches
          { name: 'Iogurte Grego Natural', category: 'Laticínio', calories: 59, portion: 100, protein: 10, carbs: 3.6, fat: 0.4 },
          { name: 'Queijo Cottage', category: 'Laticínio', calories: 98, portion: 100, protein: 11, carbs: 3.4, fat: 4.3 },
          { name: 'Amendoim', category: 'Oleaginosa', calories: 567, portion: 100, protein: 26, carbs: 16, fat: 49 },
          { name: 'Castanha de Caju', category: 'Oleaginosa', calories: 553, portion: 100, protein: 18, carbs: 30, fat: 44 },
          { name: 'Whey Protein', category: 'Suplemento', calories: 120, portion: 30, protein: 24, carbs: 3, fat: 1.5 },
        ]);
        console.log('Foods database seeded successfully!');
      }

      if (exerciseCount.length === 0) {
        console.log('Seeding exercises database...');
        await db.insert(exercises).values([
          // Cardio
          { name: 'Corrida (8 km/h)', category: 'Cardio', caloriesPerMinute: 8.0, intensity: 'Moderado' },
          { name: 'Corrida (12 km/h)', category: 'Cardio', caloriesPerMinute: 12.0, intensity: 'Intenso' },
          { name: 'Caminhada Rápida', category: 'Cardio', caloriesPerMinute: 4.5, intensity: 'Leve' },
          { name: 'Ciclismo (20 km/h)', category: 'Cardio', caloriesPerMinute: 8.5, intensity: 'Moderado' },
          { name: 'Natação (crawl)', category: 'Cardio', caloriesPerMinute: 11.0, intensity: 'Intenso' },
          { name: 'Pular Corda', category: 'Cardio', caloriesPerMinute: 12.0, intensity: 'Intenso' },
          { name: 'Elíptico', category: 'Cardio', caloriesPerMinute: 7.0, intensity: 'Moderado' },
          { name: 'Remo', category: 'Cardio', caloriesPerMinute: 9.0, intensity: 'Intenso' },
          
          // Força
          { name: 'Musculação (geral)', category: 'Força', caloriesPerMinute: 6.0, intensity: 'Moderado' },
          { name: 'Musculação Intensa', category: 'Força', caloriesPerMinute: 8.0, intensity: 'Intenso' },
          { name: 'Flexões', category: 'Força', caloriesPerMinute: 7.0, intensity: 'Moderado' },
          { name: 'Agachamento', category: 'Força', caloriesPerMinute: 8.0, intensity: 'Intenso' },
          { name: 'Prancha', category: 'Força', caloriesPerMinute: 5.0, intensity: 'Moderado' },
          
          // Flexibilidade
          { name: 'Yoga', category: 'Flexibilidade', caloriesPerMinute: 3.0, intensity: 'Leve' },
          { name: 'Pilates', category: 'Flexibilidade', caloriesPerMinute: 4.0, intensity: 'Leve' },
          { name: 'Alongamento', category: 'Flexibilidade', caloriesPerMinute: 2.5, intensity: 'Leve' },
          
          // Esportes
          { name: 'Futebol', category: 'Esporte', caloriesPerMinute: 9.0, intensity: 'Intenso' },
          { name: 'Vôlei', category: 'Esporte', caloriesPerMinute: 4.0, intensity: 'Moderado' },
          { name: 'Basquete', category: 'Esporte', caloriesPerMinute: 8.0, intensity: 'Intenso' },
          { name: 'Tênis', category: 'Esporte', caloriesPerMinute: 7.5, intensity: 'Moderado' },
          { name: 'Dança', category: 'Esporte', caloriesPerMinute: 5.5, intensity: 'Moderado' },
          
          // HIIT
          { name: 'HIIT', category: 'Cardio', caloriesPerMinute: 14.0, intensity: 'Intenso' },
          { name: 'CrossFit', category: 'Força', caloriesPerMinute: 13.0, intensity: 'Intenso' },
          { name: 'Burpees', category: 'Cardio', caloriesPerMinute: 12.5, intensity: 'Intenso' },
        ]);
        console.log('Exercises database seeded successfully!');
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }

  // Seed on startup
  seedDatabase();

  // Get all foods (with optional search)
  app.get('/api/foods', async (req, res) => {
    try {
      const search = req.query.search as string;
      
      if (search) {
        const results = await db.select()
          .from(foods)
          .where(
            or(
              ilike(foods.name, `%${search}%`),
              ilike(foods.category, `%${search}%`)
            )
          )
          .limit(50);
        return res.json(results);
      }

      const allFoods = await db.select().from(foods).limit(100);
      res.json(allFoods);
    } catch (error) {
      console.error('Error fetching foods:', error);
      res.status(500).json({ error: 'Erro ao buscar alimentos' });
    }
  });

  // Get all exercises (with optional search)
  app.get('/api/exercises', async (req, res) => {
    try {
      const search = req.query.search as string;
      
      if (search) {
        const results = await db.select()
          .from(exercises)
          .where(
            or(
              ilike(exercises.name, `%${search}%`),
              ilike(exercises.category, `%${search}%`)
            )
          )
          .limit(50);
        return res.json(results);
      }

      const allExercises = await db.select().from(exercises).limit(100);
      res.json(allExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({ error: 'Erro ao buscar exercícios' });
    }
  });

  // User Profile APIs
  app.get('/api/profile', async (req, res) => {
    try {
      const profile = await db.select().from(userProfiles).limit(1);
      if (profile.length === 0) {
        return res.json(null);
      }
      res.json(profile[0]);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  });

  app.post('/api/profile', async (req, res) => {
    try {
      const validated = insertUserProfileSchema.parse(req.body);
      
      // Check if profile exists
      const existing = await db.select().from(userProfiles).limit(1);
      
      if (existing.length > 0) {
        // Update existing profile
        const updated = await db.update(userProfiles)
          .set({ ...validated, updatedAt: new Date() })
          .where(eq(userProfiles.id, existing[0].id))
          .returning();
        return res.json(updated[0]);
      } else {
        // Create new profile
        const created = await db.insert(userProfiles).values(validated).returning();
        return res.json(created[0]);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      res.status(500).json({ error: 'Erro ao salvar perfil' });
    }
  });

  // Food Entries APIs
  app.get('/api/food-entries', async (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const entries = await db.select()
        .from(foodEntries)
        .where(eq(foodEntries.date, date))
        .orderBy(desc(foodEntries.createdAt));
      res.json(entries);
    } catch (error) {
      console.error('Error fetching food entries:', error);
      res.status(500).json({ error: 'Erro ao buscar registros de alimentos' });
    }
  });

  app.post('/api/food-entries', async (req, res) => {
    try {
      const validated = insertFoodEntrySchema.parse(req.body);
      const created = await db.insert(foodEntries).values(validated).returning();
      res.json(created[0]);
    } catch (error) {
      console.error('Error creating food entry:', error);
      res.status(500).json({ error: 'Erro ao salvar alimento' });
    }
  });

  app.delete('/api/food-entries/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(foodEntries).where(eq(foodEntries.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting food entry:', error);
      res.status(500).json({ error: 'Erro ao remover alimento' });
    }
  });

  // Workout Entries APIs
  app.get('/api/workout-entries', async (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const entries = await db.select()
        .from(workoutEntries)
        .where(eq(workoutEntries.date, date))
        .orderBy(desc(workoutEntries.createdAt));
      res.json(entries);
    } catch (error) {
      console.error('Error fetching workout entries:', error);
      res.status(500).json({ error: 'Erro ao buscar registros de treinos' });
    }
  });

  app.post('/api/workout-entries', async (req, res) => {
    try {
      const validated = insertWorkoutEntrySchema.parse(req.body);
      const created = await db.insert(workoutEntries).values(validated).returning();
      res.json(created[0]);
    } catch (error) {
      console.error('Error creating workout entry:', error);
      res.status(500).json({ error: 'Erro ao salvar treino' });
    }
  });

  app.delete('/api/workout-entries/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(workoutEntries).where(eq(workoutEntries.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting workout entry:', error);
      res.status(500).json({ error: 'Erro ao remover treino' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
