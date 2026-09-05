// src/app/shared/infrastructure/api/base-api.service.ts

import { Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { BaseAssembler } from '../assemblers/base.assembler';

export abstract class BaseApiService<TEntity, TResource, TResponse> {
  protected readonly resourceEndpoint: string;

  protected constructor(
    protected readonly http: HttpClient,
    @Inject(API_BASE_URL) protected readonly apiBaseUrl: string,
    endpoint: string,
    protected readonly assembler: BaseAssembler<TEntity, TResource, TResponse>
  ) {
    this.resourceEndpoint = `${this.apiBaseUrl}/${endpoint}`;
  }

  findAll(): Observable<TResponse[]> {
    return this.http.get<TResponse[]>(this.resourceEndpoint);
  }

  findById(id: number | string): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.resourceEndpoint}/${id}`);
  }

  create(resource: TResource): Observable<TResponse> {
    return this.http.post<TResponse>(this.resourceEndpoint, resource);
  }

  update(id: number | string, resource: Partial<TResource>): Observable<TResponse> {
    return this.http.put<TResponse>(`${this.resourceEndpoint}/${id}`, resource);
  }

  patch(id: number | string, resource: Partial<TResource>): Observable<TResponse> {
    return this.http.patch<TResponse>(`${this.resourceEndpoint}/${id}`, resource);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.resourceEndpoint}/${id}`);
  }
}