import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { Contact, PanicEvent, MeshNode, BleDevice, AuditLog, UserProfile, Organization, CustomTool } from '../types';
import { scanForNearbyDevices, stopScan, discoverAndBindTrigger, subscribeToKnownTrigger, disconnectDevice, DiscoveredDevice } from '../services/BleService';
import { LocalNotificationService } from '../services/LocalNotificationService';
const pushIncidentTelemetry = async (..._args: any[]) => true;

export const ADMIN_ORG_CODE = 'sl-admin-0000';

export interface UpdateInfo { version: string; url: string; notes?: string; required?: boolean; available?: boolean; apkUrl?: string; exeUrl?: string; }

interface AppState {
