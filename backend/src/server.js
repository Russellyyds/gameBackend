import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

// 尝试加载swagger文档，处理可能的路径问题
let swaggerDocument;
try {
  // 尝试按相对路径加载
  swaggerDocument = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'swagger.json'), 'utf8'));
} catch (err) {
  try {
    // 如果相对路径失败，尝试从当前目录加载
    swaggerDocument = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'swagger.json'), 'utf8'));
  } catch (err2) {
    console.warn('Warning: Could not load swagger.json file. API docs will not be available.');
    // 提供一个最小的swagger文档以避免错误
    swaggerDocument = {
      "swagger": "2.0",
      "info": { "title": "Game Backend API", "version": "1.0.0" },
      "paths": {}
    };
  }
}

import { AccessError, InputError, } from './error';
import {
  assertOwnsGame,
  assertOwnsSession,
  getAnswers,
  getEmailFromAuthorization,
  getGamesFromAdmin,
  getQuestion,
  getResults,
  hasStarted,
  login,
  logout,
  mutateGame,
  playerJoin,
  register,
  save,
  sessionResults,
  sessionStatus,
  submitAnswers,
  updateGamesFromAdmin
} from './service';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, }));
app.use(bodyParser.json({ limit: '100mb', }));

const catchErrors = fn => async (req, res) => {
  try {
    await fn(req, res);
    save();
  } catch (err) {
    if (err instanceof InputError) {
      res.status(400).send({ error: err.message, });
    } else if (err instanceof AccessError) {
      res.status(403).send({ error: err.message, });
    } else {
      console.log(err);
      res.status(500).send({ error: 'A system error ocurred', });
    }
  }
};

/***************************************************************
                       Auth Functions
***************************************************************/

const authed = fn => async (req, res) => {
  const email = getEmailFromAuthorization(req.header('Authorization'));
  await fn(req, res, email);
};

app.post('/admin/auth/login', catchErrors(async (req, res) => {
  const { email, password, } = req.body;
  const token = await login(email, password);
  return res.json({ token, });
}));

app.post('/admin/auth/register', catchErrors(async (req, res) => {
  const { email, password, name, } = req.body;
  const token = await register(email, password, name);
  return res.json({ token, });
}));

app.post('/admin/auth/logout', catchErrors(authed(async (req, res, email) => {
  await logout(email);
  return res.json({});
})));

/***************************************************************
                      Game Functions
***************************************************************/
app.get('/admin/games', catchErrors(authed(async (req, res, email) => { 
  const games = await getGamesFromAdmin(email);
  return res.json({ games });
})));

app.put('/admin/games', catchErrors(authed(async (req, res, email) => {
  if (!req.body || !req.body.games) {
    throw new InputError("Request body must contain a 'games' field");
  }

  const { games } = req.body;

  if (!Array.isArray(games)) {
    throw new InputError("Games must be an array");
  }
  await updateGamesFromAdmin({ gamesArrayFromRequest: games, email });
  return res.status(200).send({});
})));

app.post('/admin/game/:gameid/mutate', catchErrors(authed(async (req, res, email) => {
  const { gameid } = req.params;
  await assertOwnsGame(email, gameid);
  const { mutationType } = req.body;
  const data = await mutateGame({
    gameId: gameid,
    mutationType
  });
  return res.status(200).send({ data });
})));

app.get('/admin/session/:sessionid/status', catchErrors(authed(async (req, res, email) => {
  const { sessionid, } = req.params;
  await assertOwnsSession(email, sessionid);
  return res.status(200).json({ results: await sessionStatus(sessionid), });
})));

app.get('/admin/session/:sessionid/results', catchErrors(authed(async (req, res, email) => {
  const { sessionid, } = req.params;
  await assertOwnsSession(email, sessionid);
  return res.status(200).json({ results: await sessionResults(sessionid), });
})));

/***************************************************************
                      Play Functions
***************************************************************/

app.post('/play/join/:sessionid', catchErrors(async (req, res) => {
  const { sessionid, } = req.params;
  const { name, } = req.body;
  const playerId = await playerJoin(name, sessionid);
  return res.status(200).send({ playerId, });
}));

app.get('/play/:playerid/status', catchErrors(async (req, res) => {
  const { playerid, } = req.params;
  return res.status(200).send({ started: await hasStarted(playerid), });
}));

app.get('/play/:playerid/question', catchErrors(async (req, res) => {
  const { playerid, } = req.params;
  return res.status(200).send({ question: await getQuestion(playerid), });
}));

app.get('/play/:playerid/answer', catchErrors(async (req, res) => {
  const { playerid, } = req.params;
  return res.status(200).send({ answerIds: await getAnswers(playerid), });
}));

app.put('/play/:playerid/answer', catchErrors(async (req, res) => {
  const { playerid, } = req.params;
  const { answers, } = req.body;
  await submitAnswers(playerid, answers);
  return res.status(200).send({});
}));

app.get('/play/:playerid/results', catchErrors(async (req, res) => {
  const { playerid, } = req.params;
  return res.status(200).send(await getResults(playerid));
}));

/***************************************************************
                      Running Server
***************************************************************/

app.get('/', (req, res) => res.redirect('/docs'));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 环境配置 - 使用环境变量而不是配置文件
// 在Vercel环境中配置文件可能无法正常访问
// const port = process.env.PORT || process.env.BACKEND_PORT || 3000;

// // 添加健康检查端点，有助于验证服务是否正常运行
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// const server = app.listen(port, () => {
//   console.log(`Backend is now listening on port ${port}!`);
//   console.log(`For API docs, navigate to http://localhost:${port}/docs`);
// });

export default app;