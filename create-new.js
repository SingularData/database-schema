import { Observable } from 'rxjs';
import pgrx from 'rx-reactive';
import fs from 'fs';
import path from 'path';

let src = 'pg://odd_admin:Bko9tu39@odd-main.cfoxcbrlgeta.us-east-1.rds.amazonaws.com:5432/odd';
let dest = 'pg://postgres:9795388@localhost:5432/datarea';

let srcDB = new pgrx(src);
let destDB = new pgrx(dest);
let rxReadFile = Observable.bindNodeCallback(fs.readFile);

let schemaFiles = [
  'sql/tables.sql',
  'sql/views.sql',
  'sql/indexes.sql',
  'sql/triggers.sql'
];

let createSchema = Observable.of(schemaFiles)
  .mergeMap((sqlPath) => rxReadFile(path.resolve(__dirname, sqlPath)))
  .reduce((schema, sql) => schema + sql, '')
  .map((schema) => schema + 'CREATE EXTENSION postgis;')
  .mergeMap((schema) => destDB.query(schema));

let addPlatforms = scrDB.query('SELECT name, website FROM platform')
  .reduce((values, row) => {
    values.push(`('${row.name}', '${row.website}')`);
    return values;
  }, [])
  .map((values) => 'INSERT INTO platform (name, url) VALUES ' + values.join(','))
  .mergeMap((sql) => destDB.query(sql));

let sql = `
  SELECT i.name, i.url, i.description, p.name AS platform FROM instance AS i
  LEFT JOIN platform AS p ON p.id = i.platform_id
  WHERE i.active
`;

let addPortals = srcDB.query(sql)
  .reduce((values, row) => {
    values.push(`('${row.name}','${row.url}','${row.description}',)`,(SELECT id FROM platform WHERE name = '${row.platform}'));
    return values;
  }, [])
  .map((values) => 'INSERT INTO portal (name, url, description, platform_id) VALUES ' + values.join(','))
  .mergeMap((sql) => destDB.query(sql));

let sql = `
  SELECT jii.api_url, jii.api_key, i.url FROM junar_instance_info AS jii
  LEFT JOIN instance AS i ON i.id = jii.instance_id
  WHERE i.active
`;

let addJunarInfo = srcDB.query(sql)
  .reduce((values, row) => {
    values.push(`('${row.api_url}','${row.api_key}',(SELECT id FROM portal WHERE url = '${row.url}'))`);
    return values;
  }, [])
  .map((values) => 'INSERT INTO junar_portal_info (api_url, api_key, portal_id) VALUES ' + values.join(','))
  .mergeMap((sql) => destDB.query(sql));

Observable.merge(createSchema, addPlatforms, addPortals, addJunarInfo, 1)
  .subscribe(() => (), null, () => console.log('complete!'));