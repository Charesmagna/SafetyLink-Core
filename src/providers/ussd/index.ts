import { env } from '../../config/env';

export interface UssdRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

export interface UssdAdapter {
  parseRequest(body: any): UssdRequest;
  formatResponse(text: string, isEnd: boolean): any;
}

export class AfricasTalkingAdapter implements UssdAdapter {
  parseRequest(body: any): UssdRequest {
    return {
      sessionId: body.sessionId,
      serviceCode: body.serviceCode,
      phoneNumber: body.phoneNumber, // e.g. +27...
      text: body.text || '',
    };
  }

  formatResponse(text: string, isEnd: boolean): any {
    return `${isEnd ? 'END ' : 'CON '}${text}`;
  }
}

export class GenericAdapter implements UssdAdapter {
  parseRequest(body: any): UssdRequest {
    return {
      sessionId: body.sessionId || 'unknown',
      serviceCode: body.serviceCode || '',
      phoneNumber: body.phoneNumber || body.msisdn || '',
      text: body.text || body.message || '',
    };
  }

  formatResponse(text: string, isEnd: boolean): any {
    // Basic fallback format
    return {
      message: text,
      action: isEnd ? 'end' : 'continue'
    };
  }
}

export function getUssdAdapter(): UssdAdapter {
  if (env.USSD_PROVIDER === 'africas_talking') {
    return new AfricasTalkingAdapter();
  }
  return new GenericAdapter();
}
