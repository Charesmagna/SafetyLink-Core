import React, { useState, useEffect } from 'react';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { X, Camera } from 'lucide-react';

interface DeviceScannerProps {
  onScanComplete: (uid: string) => void;
  onCancel: () => void;
}

export const DeviceScanner: React.FC<DeviceScannerProps> = ({ onScanComplete, onCancel }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await BarcodeScanner.checkPermissions();
          if (status.camera !== 'granted') {
            const request = await BarcodeScanner.requestPermissions();
            setHasPermission(request.camera === 'granted');
          } else {
            setHasPermission(true);
          }
        } catch (e) {
          console.error("Camera permissions check failed", e);
        }
      } else {
        console.log("Not native, simulating permission");
        setHasPermission(true);
      }
    };
    checkPermissions();
    return () => {
      stopScan();
    };
  }, []);

  const startScan = async () => {
    if (!hasPermission) {
      alert('Camera permission denied.');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      // Simulate scan in web
      const mockUid = `MOCK-DEVICE-${Math.floor(Math.random() * 10000)}`;
      alert(`Web Simulation: Scanned ${mockUid}`);
      onScanComplete(mockUid);
      return;
    }

    setIsScanning(true);
    document.body.classList.add('barcode-scanner-active');

    try {
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode, BarcodeFormat.Code128],
        // lensFacing: LensFacing.Back
      });

      if (barcodes.length > 0) {
        onScanComplete(barcodes[0].rawValue);
      }
    } catch (error) {
      console.error('Scanning failed', error);
    } finally {
      stopScan();
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    document.body.classList.remove('barcode-scanner-active');
    if (Capacitor.isNativePlatform()) {
      BarcodeScanner.removeAllListeners();
    }
  };

  if (isScanning) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/40 flex flex-col justify-center items-center">
        <div className="w-[250px] h-[250px] border-4 border-emerald-500 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
        <button
          onClick={() => {
            stopScan();
            onCancel();
          }}
          className="mt-10 px-8 py-3 bg-red-500 text-white font-bold rounded-xl flex items-center gap-2"
        >
          <X className="w-5 h-5" /> Cancel Scan
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
      <div className="p-3 bg-emerald-500/20 rounded-full mb-3">
        <Camera className="w-6 h-6 text-emerald-400" />
      </div>
      <h3 className="text-slate-200 font-bold mb-1">Scan Hardware QR</h3>
      <p className="text-[10px] text-slate-500 mb-4 px-4">
        Scan the QR code printed on your camera box, smart lock, or beacon.
      </p>
      <button
        onClick={startScan}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-mono text-[11px] tracking-wider uppercase transition-colors"
      >
        Open Scanner
      </button>
    </div>
  );
};
