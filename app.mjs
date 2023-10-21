import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import fetch from "node-fetch";
import jwt from "jwt-simple";
import jwt2 from 'jsonwebtoken';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

const kcClientId = 'zendesk';
const kcClientSecret = 'ln0dKh9wQEVjIdHwWuBm6Y8JReVnktpI';
const zendeskSSOSecret = 'MdyJAitop4n3LbyySzybqCY8FtZARkKvkKocw8mOR6iobMRy';
const callbackUrl = 'http://localhost:3000/callback';
const keycloakUrl = 'http://localhost:8080/realms/admin/protocol/openid-connect';
const zendeskJwtUrl = 'https://d3v-klarthcorp.zendesk.com/access/jwt';

app.get('/login', (req, res) => {
  // Login to keycloak
  const keycloakAuthUrl = `${keycloakUrl}/auth?response_type=code&client_id=${encodeURIComponent(kcClientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
  res.redirect(keycloakAuthUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const tokenUrl = `${keycloakUrl}/token`;
  // Send code to keycloak to get token
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `client_id=${kcClientId}&client_secret=${kcClientSecret}&grant_type=authorization_code&code=${code}&redirect_uri=${callbackUrl}`
  });

  // Parse JWT token and encoding using JWT Secret
  const tokenData = await tokenResponse.json();
  const decodedJwt = jwt2.decode(tokenData.access_token);
  const encodedToken = jwt.encode(decodedJwt, zendeskSSOSecret);
  // const serverResponse = await fetch(serverUrl, {
  //   method: 'POST',
  //   headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  //   body: `jwt=${base64token}`
  // });

  // Checking server's response
  // if (serverResponse.ok) {
    res.redirect(`${zendeskJwtUrl}?jwt=${encodedToken}`);
  // } else {
  //   res.status(400).send('An error occurred');
  // }
});

export default app;
