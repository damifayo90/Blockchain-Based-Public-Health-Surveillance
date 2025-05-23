import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockPrincipal = (address: string) => ({ address });
const mockTxSender = mockPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
const mockAdmin = mockTxSender;
const mockAuthority = mockPrincipal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');

// Mock contract state
let verifiedAuthorities = new Map();
let admin = mockAdmin;

// Mock contract functions
const healthAuthority = {
  'is-admin': () => mockTxSender.address === admin.address,
  'add-authority': (authority: any) => {
    if (mockTxSender.address !== admin.address) {
      return { err: 100 }; // err-not-admin
    }
    if (verifiedAuthorities.has(authority.address)) {
      return { err: 101 }; // err-already-verified
    }
    verifiedAuthorities.set(authority.address, true);
    return { ok: true };
  },
  'remove-authority': (authority: any) => {
    if (mockTxSender.address !== admin.address) {
      return { err: 100 }; // err-not-admin
    }
    if (!verifiedAuthorities.has(authority.address)) {
      return { err: 102 }; // err-not-verified
    }
    verifiedAuthorities.delete(authority.address);
    return { ok: true };
  },
  'is-verified': (authority: any) => {
    return verifiedAuthorities.has(authority.address);
  },
  'transfer-admin': (newAdmin: any) => {
    if (mockTxSender.address !== admin.address) {
      return { err: 100 }; // err-not-admin
    }
    admin = newAdmin;
    return { ok: true };
  }
};

describe('Health Authority Contract', () => {
  beforeEach(() => {
    // Reset state before each test
    verifiedAuthorities = new Map();
    admin = mockAdmin;
  });
  
  it('should allow admin to add a new authority', () => {
    const result = healthAuthority['add-authority'](mockAuthority);
    expect(result).toEqual({ ok: true });
    expect(healthAuthority['is-verified'](mockAuthority)).toBe(true);
  });
  
  it('should not allow adding an already verified authority', () => {
    // First add succeeds
    healthAuthority['add-authority'](mockAuthority);
    
    // Second add fails
    const result = healthAuthority['add-authority'](mockAuthority);
    expect(result).toEqual({ err: 101 }); // err-already-verified
  });
  
  it('should allow admin to remove an authority', () => {
    // First add the authority
    healthAuthority['add-authority'](mockAuthority);
    
    // Then remove it
    const result = healthAuthority['remove-authority'](mockAuthority);
    expect(result).toEqual({ ok: true });
    expect(healthAuthority['is-verified'](mockAuthority)).toBe(false);
  });
  
  it('should not allow removing a non-verified authority', () => {
    const result = healthAuthority['remove-authority'](mockAuthority);
    expect(result).toEqual({ err: 102 }); // err-not-verified
  });
  
  it('should allow admin to transfer admin rights', () => {
    const newAdmin = mockPrincipal('ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    
    const result = healthAuthority['transfer-admin'](newAdmin);
    expect(result).toEqual({ ok: true });
    
    // Original admin can no longer perform admin actions
    const addResult = healthAuthority['add-authority'](mockAuthority);
    expect(addResult).toEqual({ err: 100 }); // err-not-admin
    
    // New admin can perform admin actions
    mockTxSender.address = newAdmin.address;
    const newAddResult = healthAuthority['add-authority'](mockAuthority);
    expect(newAddResult).toEqual({ ok: true });
  });
});
