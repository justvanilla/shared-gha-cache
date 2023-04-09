import { CompressionMethod } from "./cacheUtils";
import { TypedResponse } from "@actions/http-client/lib/interfaces";
import { HttpClientError } from "@actions/http-client";

export interface ITypedResponseWithError<T> extends TypedResponse<T> {
    error?: HttpClientError;
}

export interface ArtifactCacheEntry {
    cacheKey?: string;
    scope?: string;
    creationTime?: string;
    archiveLocation?: string;
}

export interface CommitCacheRequest {
    size: number;
}

export interface ReserveCacheRequest {
    key: string;
    version?: string;
    cacheSize?: number;
}

export interface ReserveCacheResponse {
    cacheId: number;
}

export interface InternalCacheOptions {
    compressionMethod?: CompressionMethod;
    cacheSize?: number;
}


/**
 * Options to control cache upload
 */
export interface UploadOptions {
    /**
     * Number of parallel cache upload
     *
     * @default 4
     */
    uploadConcurrency?: number
    /**
     * Maximum chunk size in bytes for cache upload
     *
     * @default 32MB
     */
    uploadChunkSize?: number
  }
  
  /**
   * Options to control cache download
   */
  export interface DownloadOptions {
    /**
     * Indicates whether to use the Azure Blob SDK to download caches
     * that are stored on Azure Blob Storage to improve reliability and
     * performance
     *
     * @default true
     */
    useAzureSdk?: boolean
  
    /**
     * Number of parallel downloads (this option only applies when using
     * the Azure SDK)
     *
     * @default 8
     */
    downloadConcurrency?: number
  
    /**
     * Maximum time for each download request, in milliseconds (this
     * option only applies when using the Azure SDK)
     *
     * @default 30000
     */
    timeoutInMs?: number,

    lookupOnly?: boolean
  }