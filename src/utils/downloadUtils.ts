import * as core from "@actions/core";
import { HttpClient, HttpClientResponse } from "@actions/http-client";
import { GetObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import * as buffer from "buffer";
import * as fs from "fs";
import * as stream from "stream";
import * as util from "util";

import * as utils from "./cacheUtils";
import { SocketTimeout } from "./cacheUtils";
import { DownloadOptions, UploadOptions } from "./contracts";
import { retryHttpClientResponse } from "./requestUtils";

/**
 * Pipes the body of a HTTP response to a stream
 *
 * @param response the HTTP response
 * @param output the writable stream
 */
async function pipeResponseToStream(
    response: HttpClientResponse,
    output: NodeJS.WritableStream
): Promise<void> {
    const pipeline = util.promisify(stream.pipeline);
    await pipeline(response.message, output);
}

/**
 * Download the cache using the Actions toolkit http-client
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 */
export async function downloadCacheHttpClient(
    archiveLocation: string,
    archivePath: string
): Promise<void> {
    const writeStream = fs.createWriteStream(archivePath);
    const httpClient = new HttpClient("actions/cache");
    const downloadResponse = await retryHttpClientResponse(
        "downloadCache",
        async () => httpClient.get(archiveLocation)
    );

    // Abort download if no traffic received over the socket.
    downloadResponse.message.socket.setTimeout(SocketTimeout, () => {
        downloadResponse.message.destroy();
        core.debug(
            `Aborting download, socket timed out after ${SocketTimeout} ms`
        );
    });

    await pipeResponseToStream(downloadResponse, writeStream);

    // Validate download size.
    const contentLengthHeader =
        downloadResponse.message.headers["content-length"];

    if (contentLengthHeader) {
        const expectedLength = parseInt(contentLengthHeader);
        const actualLength = utils.getArchiveFileSizeInBytes(archivePath);

        if (actualLength !== expectedLength) {
            throw new Error(
                `Incomplete download. Expected file size: ${expectedLength}, actual file size: ${actualLength}`
            );
        }
    } else {
        core.debug("Unable to validate download, no Content-Length header");
    }
}

/**
 * Download the cache using the AWS S3.  Only call this method if the use S3.
 *
 * @param key the key for the cache in S3
 * @param archivePath the local path where the cache is saved
 * @param s3Options: the option for AWS S3 client
 * @param s3BucketName: the name of bucket in AWS S3
 */
export async function downloadCacheStorageS3(
    key: string,
    archivePath: string,
    s3Options: S3ClientConfig,
    s3BucketName: string
): Promise<void> {
    const s3client = new S3Client(s3Options);
    const param = {
        Bucket: s3BucketName,
        Key: key
    };

    const response = await s3client.send(new GetObjectCommand(param));
    if (!response.Body) {
        throw new Error(
            `Incomplete download. response.Body is undefined from S3.`
        );
    }

    const fileStream = fs.createWriteStream(archivePath);

    const pipeline = util.promisify(stream.pipeline);
    await pipeline(response.Body as stream.Readable, fileStream);

    return;
}
