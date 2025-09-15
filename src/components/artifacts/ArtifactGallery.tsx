"use client";

import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FileCode2, Camera, Maximize2, Minimize2, Crop, Download, GripVertical, Plus, Save, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import componentRegistry, { ComponentItem } from './componentRegistry';

export default function ArtifactGallery() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
  const [LoadedComponent, setLoadedComponent] = useState<React.ComponentType | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(800);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArtifact, setNewArtifact] = useState({
    name: '',
    label: '',
    category: '',
    path: '',
    code: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const cats = componentRegistry.reduce((acc, item) => {
      if (item.category) {
        acc[item.category] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);
    setCategories(cats);
  }, []);

  useEffect(() => {
    if (selectedComponent) {
      const loadComponent = async () => {
        try {
          let module;
          // Direct mapping for each component to avoid dynamic import path issues
          switch (selectedComponent.name) {
            case 'PricingRecommendation':
              module = await import('./pricing/PricingRecommendation');
              break;
            case 'PriceRecommendationFlat':
              module = await import('./pricing/PriceRecommendationFlat');
              break;
            case 'ViewContractEnterpriseBasic':
              module = await import('./contracts/ViewContractEnterpriseBasic');
              break;
            case 'ViewContractEnterprise':
              module = await import('./contracts/ViewContractEnterprise');
              break;
            case 'ContractWorkflowAlert':
              module = await import('./contracts/ContractWorkflowAlert');
              break;
            case 'ViewContractDetails':
              module = await import('./contracts/ViewContractDetails');
              break;
            case 'UsageUpsellWorkflow':
              module = await import('./expansion/UsageUpsellWorkflow');
              break;
            case 'PlgPriceIncreaseTest':
              module = await import('./campaigns/PlgPriceIncreaseTest');
              break;
            case 'AutomatedPLGCampaigns':
              module = await import('./campaigns/AutomatedPLGCampaigns');
              break;
            case 'RenewalsDashboard':
              module = await import('./dashboards/RenewalsDashboard');
              break;
            case 'ExpansionDashboard-qtr':
              module = await import('./dashboards/ExpansionDashboard-qtr');
              break;
            case 'TeamForecast-qtr':
              module = await import('./dashboards/TeamForecast-qtr');
              break;
            case 'ChatTemplate':
              module = await import('./chat/ChatTemplate');
              break;
            case 'TaskModeBasic':
              module = await import('./workflows/TaskModeBasic');
              break;
            default:
              throw new Error(`Unknown component: ${selectedComponent.name}`);
          }
          setLoadedComponent(() => module.default);
        } catch (error) {
          console.error('Error loading component:', error);
          setLoadedComponent(null);
        }
      };
      loadComponent();
    }
  }, [selectedComponent]);

  const toggleCategory = (category: string) => {
    setCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const captureScreenshot = async () => {
    if (!selectedComponent || !previewRef.current) return;
    
    setIsCapturing(true);
    
    try {
      // Use the browser's native screenshot capability as fallback
      if ('getDisplayMedia' in navigator.mediaDevices) {
        // Try using screen capture API first
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' }
          });
          
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          video.addEventListener('loadedmetadata', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              setCapturedCanvas(canvas);
              setCropArea({ x: 0, y: 0, width: canvas.width, height: canvas.height });
              setShowCropModal(true);
              
              // Stop the stream
              stream.getTracks().forEach(track => track.stop());
            }
          });
          
          setIsCapturing(false);
          return;
        } catch (screenError) {
          console.log('Screen capture not available, falling back to html2canvas');
        }
      }
      
      // Fallback to html2canvas with minimal options
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: 'white',
        scale: 1,
        logging: false,
        useCORS: false,
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: true,
        onclone: (clonedDoc, element) => {
          // Remove all stylesheets to avoid oklch issues
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
          links.forEach(link => link.remove());
          
          // Apply basic inline styles
          const allElements = element.querySelectorAll('*');
          allElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            // Set basic fallback colors
            if (!htmlEl.style.color) htmlEl.style.color = '#000000';
            if (!htmlEl.style.backgroundColor && htmlEl.tagName !== 'DIV') {
              htmlEl.style.backgroundColor = 'transparent';
            }
          });
        }
      });
      
      setCapturedCanvas(canvas);
      setCropArea({ x: 0, y: 0, width: canvas.width, height: canvas.height });
      setShowCropModal(true);
      
      // Draw the captured image on the canvas once the modal opens
      setTimeout(() => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const canvasWidth = Math.min(canvas.width, 800);
            const canvasHeight = Math.min(canvas.height, 600);
            const scaleX = canvasWidth / canvas.width;
            const scaleY = canvasHeight / canvas.height;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = canvas.width * scale;
            const scaledHeight = canvas.height * scale;
            
            canvasRef.current.width = scaledWidth;
            canvasRef.current.height = scaledHeight;
            
            ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert(`Screenshot failed. Try using your browser's built-in screenshot tool (Ctrl+Shift+S in Firefox, or right-click → "Capture screenshot" in Chrome developer tools)`);
    }
    
    setIsCapturing(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, width: previewWidth });
    document.body.style.cursor = 'col-resize';
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStart.x;
    const newWidth = Math.max(300, Math.min(1400, resizeStart.width + deltaX));
    setPreviewWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart]);

  const createArtifact = async () => {
    if (!newArtifact.name || !newArtifact.label || !newArtifact.code) {
      alert('Please fill in all required fields (name, label, and code)');
      return;
    }

    setIsCreating(true);

    try {
      // Show instructions to the user
      const instructions = `To complete the artifact creation:

1. Copy the code below
2. Create a new file at the suggested path
3. Paste the code into the file
4. Add the component to the registry
5. Refresh this page

Component Name: ${newArtifact.name}
Label: ${newArtifact.label}
Category: ${newArtifact.category || 'Custom'}
Suggested Path: ${newArtifact.path || `src/components/artifacts/custom/${newArtifact.name}.tsx`}

Code to copy:`;

      // Create a temporary textarea to copy the code
      const textarea = document.createElement('textarea');
      textarea.value = newArtifact.code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      alert(`${instructions}\n\nCode has been copied to your clipboard!`);
      
      console.log('=== ARTIFACT CREATION DETAILS ===');
      console.log('Name:', newArtifact.name);
      console.log('Label:', newArtifact.label);
      console.log('Category:', newArtifact.category || 'Custom');
      console.log('Suggested Path:', newArtifact.path || `src/components/artifacts/custom/${newArtifact.name}.tsx`);
      console.log('Code:', newArtifact.code);
      console.log('=== END ARTIFACT DETAILS ===');
      
      // Reset form
      setNewArtifact({
        name: '',
        label: '',
        category: '',
        path: '',
        code: ''
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating artifact:', error);
      alert('Failed to prepare artifact. Please try again.');
    }

    setIsCreating(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !capturedCanvas) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = capturedCanvas.width / canvasRef.current.width;
    const scaleY = capturedCanvas.height / canvasRef.current.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !capturedCanvas) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = capturedCanvas.width / canvasRef.current.width;
    const scaleY = capturedCanvas.height / canvasRef.current.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCropArea({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const downloadCroppedImage = () => {
    if (!capturedCanvas) return;
    
    const croppedCanvas = document.createElement('canvas');
    const ctx = croppedCanvas.getContext('2d');
    
    if (!ctx) return;
    
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    
    ctx.drawImage(
      capturedCanvas,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );
    
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedComponent!.name}-cropped-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
    
    setShowCropModal(false);
    setCapturedCanvas(null);
  };

  const downloadFullImage = () => {
    if (!capturedCanvas) return;
    
    capturedCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedComponent!.name}-full-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
    
    setShowCropModal(false);
    setCapturedCanvas(null);
  };

  const groupedComponents = componentRegistry.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ComponentItem[]>);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className={`font-semibold text-lg text-gray-900 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
              Artifact Gallery
            </h1>
            <div className="flex items-center gap-2">
              {!sidebarCollapsed && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                  title="Add new artifact"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {!sidebarCollapsed && (
            <div className="space-y-2">
              {Object.entries(groupedComponents).map(([category, items]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
                  >
                    {categories[category] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <Folder className="w-4 h-4 text-blue-500" />
                    {category}
                  </button>
                  
                  {categories[category] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => setSelectedComponent(item)}
                          className={`flex items-center gap-2 w-full p-2 pl-4 hover:bg-blue-50 rounded-lg transition-colors text-sm ${
                            selectedComponent?.path === item.path
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600'
                          }`}
                        >
                          <FileCode2 className="w-4 h-4" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {selectedComponent ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedComponent.label}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500">{selectedComponent.path}</p>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {previewWidth}px wide
                    </span>
                  </div>
                </>
              ) : (
                <h2 className="text-xl font-semibold text-gray-900">Select a component to preview</h2>
              )}
            </div>
            
            {selectedComponent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Toggle fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={captureScreenshot}
                  disabled={isCapturing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  {isCapturing ? 'Capturing...' : 'Screenshot'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className={`flex-1 overflow-auto ${isFullscreen ? 'p-0' : 'p-6'} flex`}>
          <div className="flex-1 flex justify-center">
            <div className="relative flex">
              <div
                ref={previewRef}
                id="artifact-preview"
                style={{ width: `${previewWidth}px` }}
                className={`${
                  isFullscreen 
                    ? 'min-h-full' 
                    : 'bg-white rounded-lg shadow-sm border border-gray-200 min-h-full'
                } transition-all duration-200`}
              >
            {selectedComponent && LoadedComponent ? (
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading component...</div>
                </div>
              }>
                <LoadedComponent />
              </Suspense>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <FileCode2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No component selected</p>
                  <p className="text-sm mt-2">Choose a component from the sidebar to preview</p>
                </div>
              </div>
            )}
              </div>
              
              {/* Resize Handle */}
              {!isFullscreen && (
                <div
                  className="w-3 bg-gray-100 hover:bg-gray-200 cursor-col-resize flex items-center justify-center border-r border-gray-300 transition-colors"
                  onMouseDown={handleResizeStart}
                  title="Drag to resize preview width"
                >
                  <GripVertical className="w-3 h-3 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && capturedCanvas && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-screen overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crop Screenshot</h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCapturedCanvas(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 text-sm text-gray-600">
              Click and drag to select the area you want to crop
            </div>
            
            <div className="relative inline-block mb-4">
              <canvas
                ref={canvasRef}
                className="border cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
              
              {/* Crop overlay */}
              {canvasRef.current && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                  style={{
                    left: (cropArea.x / capturedCanvas.width) * canvasRef.current.width,
                    top: (cropArea.y / capturedCanvas.height) * canvasRef.current.height,
                    width: (cropArea.width / capturedCanvas.width) * canvasRef.current.width,
                    height: (cropArea.height / capturedCanvas.height) * canvasRef.current.height,
                    display: cropArea.width > 0 && cropArea.height > 0 ? 'block' : 'none',
                  }}
                />
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={downloadFullImage}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
                Download Full
              </button>
              <button
                onClick={downloadCroppedImage}
                disabled={cropArea.width === 0 || cropArea.height === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Crop className="w-4 h-4" />
                Download Cropped
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Artifact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Add New Artifact</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component Name *
                </label>
                <input
                  type="text"
                  value={newArtifact.name}
                  onChange={(e) => setNewArtifact({...newArtifact, name: e.target.value})}
                  placeholder="e.g., MyComponent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used for the component function name and file name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Label *
                </label>
                <input
                  type="text"
                  value={newArtifact.label}
                  onChange={(e) => setNewArtifact({...newArtifact, label: e.target.value})}
                  placeholder="e.g., My Custom Component"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Displayed in the gallery sidebar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newArtifact.category}
                  onChange={(e) => setNewArtifact({...newArtifact, category: e.target.value})}
                  placeholder="e.g., Custom, UI Components, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to use "Custom"</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Path
                </label>
                <input
                  type="text"
                  value={newArtifact.path}
                  onChange={(e) => setNewArtifact({...newArtifact, path: e.target.value})}
                  placeholder="e.g., artifacts/custom/MyComponent or /absolute/path"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Relative to src/components/ or absolute path. Leave empty for default location.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component Code *
                </label>
                <textarea
                  value={newArtifact.code}
                  onChange={(e) => setNewArtifact({...newArtifact, code: e.target.value})}
                  placeholder="import React from 'react';

export default function MyComponent() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  rows={12}
                />
                <p className="text-xs text-gray-500 mt-1">Complete React component code</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createArtifact}
                disabled={isCreating || !newArtifact.name || !newArtifact.label || !newArtifact.code}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create Artifact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}