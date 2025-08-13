'use client'
import React, { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import Feed from './Feed';
import RightSidebar from './RightSidebar';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../ui/sheet';
import { MenuIcon, X } from 'lucide-react';

const Home = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSheetClose = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">App Name</h1>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button 
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Open navigation menu"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <SheetTitle className="text-lg font-semibold">Navigation</SheetTitle>
                <button
                  onClick={handleSheetClose}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SheetDescription className="sr-only">
                Main navigation menu for the application
              </SheetDescription>
              <div className="overflow-y-auto">
                <LeftSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:block w-64 lg:w-80 fixed left-0 top-0 h-screen border-r border-gray-200 bg-white overflow-y-auto z-10">
          <div className="p-4">
            <LeftSidebar />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 lg:ml-80 lg:mr-80">
          <div className="pt-16 md:pt-0">
            <Feed />
          </div>
        </main>

        {/* Desktop Right Sidebar */}
        <aside className="hidden lg:block w-80 fixed right-0 top-0 h-screen bg-white border-l border-gray-200 overflow-y-auto z-10">
          <div className="p-6">
            <RightSidebar />
          </div>
        </aside>
      </div>


    </div>
  );
};

export default Home;