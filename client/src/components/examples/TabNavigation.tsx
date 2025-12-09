import { useState } from 'react';
import TabNavigation from '../TabNavigation';

export default function TabNavigationExample() {
  const [activeTab, setActiveTab] = useState('calories');
  
  return (
    <div className="max-w-md mx-auto border rounded-lg overflow-hidden">
      <div className="p-4 bg-card text-center">
        <p className="text-sm text-muted-foreground">Active Tab: <span className="font-medium text-primary">{activeTab}</span></p>
      </div>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}