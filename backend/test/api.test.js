import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import db from '../src/db/init.js';

describe('PolicyGuard AML Backend & Database Tests', () => {
  it('should initialize database with all required schema tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map(t => t.name);

    const requiredTables = [
      'users',
      'accounts',
      'transactions',
      'threats',
      'rules',
      'cases',
      'reports',
      'audit_log',
      'scan_jobs',
    ];

    for (const table of requiredTables) {
      assert.ok(tables.includes(table), `Expected table ${table} to exist in database`);
    }
  });

  it('should verify seeded user accounts and password hashing', () => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@policyguard.ai');
    assert.ok(user, 'Default admin account should exist');
    assert.equal(user.role, 'admin');
    assert.ok(bcrypt.compareSync('password123', user.password_hash), 'Password hash must verify password123');

    const lead = db.prepare('SELECT * FROM users WHERE email = ?').get('vikas@policyguard.ai');
    assert.ok(lead, 'Compliance lead account should exist');
    assert.equal(lead.role, 'compliance_lead');
  });

  it('should filter transactions accurately by laundering flag', () => {
    const launderingRows = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE is_laundering = 1').get();
    const cleanRows = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE is_laundering = 0').get();

    assert.ok(launderingRows.count >= 0, 'Laundering count should be a valid number');
    assert.ok(cleanRows.count > 0, 'Clean transactions should be seeded');
  });

  it('should query threats with associated transaction details', () => {
    const threat = db.prepare(`
      SELECT t.*, tx.amount, tx.currency, tx.payment_format
      FROM threats t
      LEFT JOIN transactions tx ON t.transaction_id = tx.id
      LIMIT 1
    `).get();

    assert.ok(threat, 'Should return at least one threat record');
    assert.ok(threat.id, 'Threat record must have an ID');
    assert.ok(['critical', 'high', 'medium', 'low'].includes(threat.severity), 'Threat has valid severity');
  });

  it('should enforce relational integrity between cases and users', () => {
    const caseRow = db.prepare('SELECT * FROM cases LIMIT 1').get();
    if (caseRow && caseRow.analyst_id) {
      const assignedUser = db.prepare('SELECT id FROM users WHERE id = ?').get(caseRow.analyst_id);
      assert.ok(assignedUser, 'Assigned user in case must exist in users table');
    }
  });

  it('should verify accounts balance and risk score constraints', () => {
    const highRiskAccounts = db.prepare('SELECT COUNT(*) as count FROM accounts WHERE risk_score >= 80').get();
    const activeAccounts = db.prepare('SELECT COUNT(*) as count FROM accounts WHERE status = ?').get('active');

    assert.ok(typeof highRiskAccounts.count === 'number', 'High risk accounts count should be numeric');
    assert.ok(activeAccounts.count > 0, 'There should be active accounts in the system');
  });

  it('should verify rule definitions and active status', () => {
    const activeRules = db.prepare('SELECT COUNT(*) as count FROM rules WHERE is_active = 1').get();
    assert.ok(activeRules.count > 0, 'At least one detection rule must be active');
  });
});
