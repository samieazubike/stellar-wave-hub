import ts from "typescript";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const req = createRequire(new URL("../package.json", import.meta.url));
const base = new URL("../src/", import.meta.url);
function load(file, mocks) {
  const exports = {};const mod = { exports };
  const js=ts.transpileModule(readFileSync(new URL(file,base),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(js,{exports,module:mod,require:(id)=>id in mocks?mocks[id]:req(id),Response,Request,URL,console});return mod.exports;
}
const schemas=load("lib/validation/schemas/admin-users.ts",{});
let actor={userId:1,role:'admin'},actorRow={role:'admin'},rpcCalls=[];
const auth=load('lib/admin-user-auth.ts',{'./auth':{getAuthUser:()=>actor},'./db':{usersCol:{ref:{doc:()=>({get:async()=>({exists:!!actorRow,data:()=>actorRow})})}}}});
let selected,range,or,queryError=null;
const query={select:(value)=>{selected=value;return query},eq:()=>query,or:value=>{or=value;return query},order:()=>query,range:async(a,b)=>{range=[a,b];return {data:[{numericId:3,username:'person',email:'p@example.test',role:'contributor',created_at:'2026-10-21'}],count:26,error:queryError}}};
let rpcError=null;
const db={getSupabase:()=>({from:()=>query,rpc:async(name,args)=>{rpcCalls.push({name,args});return {data:{id:3,role:args.new_role},error:rpcError}}})};
const mocks={'@/lib/admin-user-auth':auth,'@/lib/firebase':db,'@/lib/validation/schemas/admin-users':schemas};
const list=load('app/api/admin/users/route.ts',mocks);const role=load('app/api/admin/users/[id]/role/route.ts',mocks);
const request=(body)=>new Request('http://local.test/api/admin/users/3/role',{method:'PUT',body:typeof body==='string'?body:JSON.stringify(body)});
for(const value of [null,{userId:3,role:'contributor'},{userId:3,role:'maintainer'}]) {actor=value;assert.equal((await list.GET(new Request('http://local.test/api/admin/users'))).status,403);assert.equal((await role.PUT(request({role:'maintainer'}),{params:Promise.resolve({id:'3'})})).status,403);}
actor={userId:1,role:'admin'};actorRow={role:'contributor'};assert.equal((await list.GET(new Request('http://local.test/api/admin/users'))).status,403);assert.equal(rpcCalls.length,0);
actorRow={role:'admin'};
let result=await list.GET(new Request('http://local.test/api/admin/users?search=person&role=contributor&page=2'));assert.equal(result.status,200);assert.deepEqual(range,[25,49]);assert.equal(selected,'numericId,username,email,role,created_at');assert.ok(or.includes('person'));let body=await result.json();assert.equal(body.pagination.total,26);assert.equal(body.users[0].id,3);assert.ok(!('password_hash' in body.users[0]));
for(const suffix of ['page=0','page=1.5','role=owner']) assert.equal((await list.GET(new Request('http://local.test/api/admin/users?'+suffix))).status,400);
assert.equal((await role.PUT(request('{bad'),{params:Promise.resolve({id:'3'})})).status,400);
assert.equal((await role.PUT(request({role:'owner'}),{params:Promise.resolve({id:'3'})})).status,400);
assert.equal((await role.PUT(request({role:'admin',password_hash:'bad'}),{params:Promise.resolve({id:'3'})})).status,400);
assert.equal((await role.PUT(request({role:'maintainer'}),{params:Promise.resolve({id:'-1'})})).status,400);
for(const next of ['maintainer','contributor']) { result=await role.PUT(request({role:next}),{params:Promise.resolve({id:'3'})});assert.equal(result.status,200);assert.equal((await result.json()).user.role,next);assert.deepEqual(JSON.parse(JSON.stringify(rpcCalls.at(-1).args)),{actor_id:1,target_id:3,new_role:next}); }
for(const [code,status] of [['42501',403],['P0002',404],['23514',409],['XX000',500]]) {rpcError={code};assert.equal((await role.PUT(request({role:'maintainer'}),{params:Promise.resolve({id:'3'})})).status,status);}
console.log('ADMIN API BEHAVIOR VERIFIED');
