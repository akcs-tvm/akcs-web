/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
import { generateWinner } from './generate-winner'; // Ensure the path is correct

import { getWinner } from "./get-winner";
// export const testFunction = onRequest((req, res) => {
//     res.send("Test function is working!");
//   });
export const generateWinnerFunction = onRequest(generateWinner);
export const getWinnerFunction = onRequest(getWinner);

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
