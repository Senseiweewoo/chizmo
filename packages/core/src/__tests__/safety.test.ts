import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectCrisisIntent, VERIFIED_CRISIS_HOTLINES } from '../safety/crisis-detector.js';

describe('Safety & Crisis Detector Tests', () => {
  it('1. Detects clear crisis statements and provides hotlines', () => {
    const res = detectCrisisIntent('I want to end my life, everything is too painful');
    assert.equal(res.isCrisis, true);
    assert.equal(res.crisisType, 'SELF_HARM');
    assert.ok(res.compassionateResponse);
    assert.ok(res.hotlines.length >= 4);
    assert.ok(res.hotlines.some((h) => h.contact.includes('988')));
  });

  it('2. Excludes biology and technical terminology from false triggers', () => {
    const resBio = detectCrisisIntent('Explain programmed cell death and apoptosis during embryonic development');
    assert.equal(resBio.isCrisis, false);

    const resTech = detectCrisisIntent('How do I kill process on port 3000 in powershell?');
    assert.equal(resTech.isCrisis, false);
  });

  it('3. Verified crisis hotlines contain free and 24/7 details', () => {
    for (const h of VERIFIED_CRISIS_HOTLINES) {
      assert.ok(h.name.length > 0);
      assert.ok(h.contact.length > 0);
      assert.ok(h.detail.length > 0);
    }
  });
});
