import React from 'react';

interface WowLayoutProps {
  children: React.ReactNode;
}

export default function WowLayout({ children }: WowLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
