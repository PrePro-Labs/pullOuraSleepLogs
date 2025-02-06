import { DateTime } from "luxon";
import helperFunctions from "./helperFunctions.js";

export const handler = async (event) => {
  try {
    console.log("---------- STARTING PROCESS ----------");

    const { lambdaKey, userId, date: userDate } = JSON.parse(event.body);

    if (!lambdaKey || !userId) {
      throw new Error(`Invalid request body...`, event.body);
    }

    if (lambdaKey !== process.env.LAMBDA_API_KEY) {
      throw new Error(`Invalid API key`);
    }

    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    const date =
      userDate && regex.test(userDate) ? userDate : DateTime.now().toISODate();

    // get prepro logs
    console.log(`-- Getting prepro log for ${date}`);
    const preproLog = await helperFunctions.getPreproLog(userId, date);
    console.log(`-- ${preproLog.length} rows returned from prepro`);

    if (preproLog.length) {
      // log already uploaded for the day
      console.log("-- Log already exists");
    } else {
      // getting oura log api key
      console.log("-- Getting Oura api key", new Date());
      const apiKey = await helperFunctions.getOuraAPIKey(userId);
      console.log("-- Got api key", new Date());

      // getting oura log
      console.log("-- Getting Oura log", new Date());
      const ouraLog = await helperFunctions.getOuraLog(apiKey, date);
      console.log("-- Got Oura log", new Date());

      if (ouraLog.length) {
        // upload to prepro
        console.log("-- Uploading to prepro", new Date());
        await helperFunctions.uploadToPrepro(userId, date, ouraLog[0]);
        console.log("-- Uploaded to prepro", new Date());
      } else {
        console.log("-- No data from Oura", new Date());
      }
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify(`-- FINISHED`),
    };
    console.log("---------- EXITING PROCESS (SUCCESS) ----------");
    return response;
  } catch (err) {
    console.log("---------- EXITING PROCESS (ERROR) ----------");
    console.log(err);
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        error: err.message || "An unknown error occurred",
      }),
    };
    return response;
  }
};
