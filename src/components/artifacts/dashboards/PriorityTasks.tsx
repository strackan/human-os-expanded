"use client";

import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Play } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  customer: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  type: 'renewal' | 'expansion' | 'health_check' | 'onboarding';
}

interface PriorityTasksProps {
  data: Task[];
  onLaunchTaskMode: (taskId?: number) => void;
  launchingTask: number | null;
}

const PriorityTasks: React.FC<PriorityTasksProps> = ({ data, onLaunchTaskMode, launchingTask }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'renewal': return <Calendar className="w-4 h-4" />;
      case 'expansion': return <Play className="w-4 h-4" />;
      case 'health_check': return <CheckCircle className="w-4 h-4" />;
      case 'onboarding': return <Play className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Priority Tasks</h2>
        <span className="text-sm text-gray-500">{data.length} tasks</span>
      </div>
      
      <div className="space-y-4">
        {data.map((task) => (
          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex-shrink-0">
              {getTaskTypeIcon(task.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.customer}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {getStatusIcon(task.status)}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Due: {task.dueDate}</span>
                
                <button
                  onClick={() => onLaunchTaskMode(task.id)}
                  disabled={launchingTask === task.id}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {launchingTask === task.id ? (
                    <>
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Launching...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      Launch Task Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No priority tasks at this time</p>
        </div>
      )}
    </div>
  );
};

export default PriorityTasks;
