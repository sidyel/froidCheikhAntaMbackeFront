import { InjectionToken } from '@angular/core';
import type { Response, Request } from 'express';

/** Token pour injecter l'objet Response Express côté serveur SSR. */
export const SSR_RESPONSE = new InjectionToken<Response>('SSR_RESPONSE');

/** Token pour injecter l'objet Request Express côté serveur SSR. */
export const SSR_REQUEST = new InjectionToken<Request>('SSR_REQUEST');
