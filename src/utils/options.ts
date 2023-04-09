import * as core from "@actions/core";
import { getProxyUrl } from "@actions/http-client";
import { S3ClientConfig } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import ProxyAgent from "proxy-agent";

import { Inputs } from "../constants";
import { DownloadOptions, UploadOptions } from "./contracts";

export function getConfig(): S3ClientConfig {
    const proxy = getProxyUrl("https://amazonaws.com");

    const config: S3ClientConfig = {
        credentials: {
            accessKeyId: core.getInput(Inputs.AwsAccessKeyId),
            secretAccessKey: core.getInput(Inputs.AwsSecretAccessKey)
        },
        region: core.getInput(Inputs.AwsRegion)
    };

    if (proxy) {
        config.requestHandler = new NodeHttpHandler({
            httpsAgent: ProxyAgent(proxy)
        });
    }

    return config;
}

/**
 * Returns a copy of the upload options with defaults filled in.
 *
 * @param copy the original upload options
 */
export function getUploadOptions(copy?: UploadOptions): UploadOptions {
    const result: UploadOptions = {
        uploadConcurrency: 4,
        uploadChunkSize: 32 * 1024 * 1024
    };

    if (copy) {
        if (typeof copy.uploadConcurrency === "number") {
            result.uploadConcurrency = copy.uploadConcurrency;
        }

        if (typeof copy.uploadChunkSize === "number") {
            result.uploadChunkSize = copy.uploadChunkSize;
        }
    }

    core.debug(`Upload concurrency: ${result.uploadConcurrency}`);
    core.debug(`Upload chunk size: ${result.uploadChunkSize}`);

    return result;
}

/**
 * Returns a copy of the download options with defaults filled in.
 *
 * @param copy the original download options
 */
export function getDownloadOptions(copy?: DownloadOptions): DownloadOptions {
    const result: DownloadOptions = {
        useAzureSdk: true,
        downloadConcurrency: 8,
        timeoutInMs: 30000
    };

    if (copy) {
        if (typeof copy.useAzureSdk === "boolean") {
            result.useAzureSdk = copy.useAzureSdk;
        }

        if (typeof copy.downloadConcurrency === "number") {
            result.downloadConcurrency = copy.downloadConcurrency;
        }

        if (typeof copy.timeoutInMs === "number") {
            result.timeoutInMs = copy.timeoutInMs;
        }
    }

    core.debug(`Use Azure SDK: ${result.useAzureSdk}`);
    core.debug(`Download concurrency: ${result.downloadConcurrency}`);
    core.debug(`Request timeout (ms): ${result.timeoutInMs}`);

    return result;
}
