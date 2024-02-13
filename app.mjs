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
const kcEuClientId = 'zendesk-eu';

const kcClientSecret = '';
const kcEuClientSecret = '';

const zendeskSSOSecret = '';
const callbackUrl = 'http://localhost:3000/callback';
const keycloakUrl = 'http://localhost:8080/realms/admin/protocol/openid-connect';
const zendeskJwtUrl = 'https://d3v-klarthcorp.zendesk.com/access/jwt';

app.get('/login', (req, res) => {
  const returnTo = req.query.return_to ?? '';
  let clientId, clientSecret;

  // TODO: Define whether to check to EU or US. In the final script we will have different urls in addition to different clients
  switch (true) {
    case returnTo.includes('d3v-klarthcorp-us'):
      clientId = kcClientId;
      clientSecret = kcClientSecret;
      break;
    case returnTo.includes('d3v-klarthcorp-eu'):
      clientId = kcEuClientId;
      clientSecret = kcEuClientSecret;
      break;
    default:
      clientId = kcClientId;
      clientSecret = kcClientSecret;
  }


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
  res.redirect(`${zendeskJwtUrl}?jwt=${encodedToken}`);
});

export default app;
