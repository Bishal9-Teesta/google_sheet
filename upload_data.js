const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "token.json";
const SPREADSHEET_ID = "1XMhPwJ4D4njZOLEncT2e6F06RHlEvSoE7PmZElacxDM";

// Load client secrets from a JSON file
fs.readFile("./client_secret.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);

    authorize(JSON.parse(content), uploadRow);
});

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    // Check if we have previously stored a token
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "online",
        scope: SCOPES,
    });

    console.log("Authorize this app by visiting this URL:", authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error("Error retrieving access token", err);

            oAuth2Client.setCredentials(token);

            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log("Token stored to", TOKEN_PATH);
            });

            callback(oAuth2Client);
        });
    });
}

function uploadRow(auth) {
    const sheets = google.sheets({ version: "v4", auth });

    // Sample data to be uploaded
    const rowData = ["John Doe", "john.doe@example.com", "Developer", "New York"];

    sheets.spreadsheets.values.append(
        {
            spreadsheetId: SPREADSHEET_ID,
            range: "Sheet1", // Change the sheet name if required
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            resource: {
                values: [rowData],
            },
        },
        (err, response) => {
            if (err) return console.error("The API returned an error:", err);

            console.log("Row uploaded successfully.");
        }
    );
}
