import { DateTime } from "luxon";
import helperFunctions from "./helperFunctions.js";

export const handler = async (event) => {
  try {
    console.log("---------- STARTING PROCESS ----------");

    const date = DateTime.now().toISODate();

    // get prepro logs
    console.log(`-- Getting prepro log for ${date}`);
    const preproLog = await helperFunctions.getPreproLog(date);
    console.log(`-- ${preproLog.length} rows returned from prepro`);

    if (preproLog.length) {
      // log already uploaded for the day
      console.log("-- Log already exists");
    } else {
      console.log("-- Getting Oura log", new Date());
      const ouraLog = await helperFunctions.getOuraLog(date);
      console.log("-- Got Oura log", new Date());

      if (ouraLog.length) {
        // upload to prepro
        console.log("-- Uploading to prepro", new Date());
        await helperFunctions.uploadToPrepro(date, ouraLog[0]);
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
    // process.exit();
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
    // process.exit();
    return response;
  }
};
