import {HttpError} from "@refinedev/core";

export function getMessageForStatusCode(error: HttpError) {
    if (error.message != null) {
        return error.message
    } else if (error.statusCode == undefined) {
        return "Can't reach the server. Either Jinjat is not running or the CORS is not enabled correctly. Check the Network tab for CORS error and make sure your Jinjat server is running."
    } else {
        return `Unexpected status code: ${error.statusCode}`
    }
}