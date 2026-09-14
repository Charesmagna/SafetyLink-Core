/**
 * FIX #7: PBKDF2 Encryption on Main Thread
 * Web Worker for heavy crypto operations to prevent UI blocking.
 * Previously: PBKDF2 with 100,000 iterations blocked main thread
 * Now: Delegated to worker thread
 */

let cryptoWorker: Worker | null = null;

function initWorker(): Worker {
  if (cryptoWorker) return cryptoWorker;

  const workerCode = `
    self.onmessage = async (e) => {
      const { id, operation, data } = e.data;
      
      try {
        if (operation === 'deriveKey') {
          const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: new Uint8Array(data.salt), iterations: 100000, hash: 'SHA-256' },
            await crypto.subtle.importKey('raw', new TextEncoder().encode(data.password), 'PBKDF2', false, ['deriveKey']),
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          const exported = await crypto.subtle.exportKey('raw', key);
          self.postMessage({ id, success: true, result: Array.from(new Uint8Array(exported)) });
        }
      } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  cryptoWorker = new Worker(URL.createObjectURL(blob));
  return cryptoWorker;
}

export async function deriveKeyInWorker(password: string, salt: ArrayBuffer): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const worker = initWorker();
    const id = Math.random();

    const handler = (e: MessageEvent) => {
      if (e.data.id === id) {
        worker.removeEventListener('message', handler);
        if (e.data.success) {
          resolve(new Uint8Array(e.data.result).buffer);
        } else {
          reject(new Error(e.data.error));
        }
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage({
      id,
      operation: 'deriveKey',
      data: {
        password,
        salt: Array.from(new Uint8Array(salt))
      }
    });
  });
}
