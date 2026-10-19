import test from 'node:test';
import assert from 'node:assert/strict';
import { loginDestination } from '../src/utils/account.js';

test('Sign-in routes every account role to its dashboard',()=>{
  for(const [role,path] of [['customer','/account'],['seller','/seller'],['admin','/admin']]){
    assert.equal(loginDestination(role,null),path);
    assert.equal(loginDestination(role,'https://outside.example'),path);
    assert.equal(loginDestination(role,'//outside.example'),path);
    assert.equal(loginDestination(role,'/\\outside.example'),path);
    assert.equal(loginDestination(role,'/login'),path);
    assert.equal(loginDestination(role,'/seller/login'),path);
    assert.equal(loginDestination(role,'/checkout'),'/checkout');
  }
  assert.equal(loginDestination('customer','/admin'),'/account');
  assert.equal(loginDestination('seller','/admin'),'/seller');
  assert.equal(loginDestination('admin','/admin'),'/admin');
});
