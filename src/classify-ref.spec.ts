import { describe, expect, it } from 'vitest';
import { classifyRef } from './classify-ref.js';

describe('classifyRef', () => {
  describe('prerequisite', () => {
    it('"prerequisite"', () => {
      expect(classifyRef('This is a prerequisite')).toBe('prerequisite');
    });
    it('"run" + "before"', () => {
      expect(classifyRef('run this before using')).toBe('prerequisite');
    });
    it('"require"', () => {
      expect(classifyRef('you require this skill')).toBe('prerequisite');
    });
    it('"must have"', () => {
      expect(classifyRef('you must have this active')).toBe('prerequisite');
    });
    it('"ensure"', () => {
      expect(classifyRef('ensure this is done')).toBe('prerequisite');
    });
    it('"active session"', () => {
      expect(classifyRef('needs active session')).toBe('prerequisite');
    });
  });

  describe('calls', () => {
    it('"full logic in"', () => {
      expect(classifyRef('full logic in this skill')).toBe('calls');
    });
    it('"apply those instructions"', () => {
      expect(classifyRef('apply those instructions')).toBe('calls');
    });
    it('"calls"', () => {
      expect(classifyRef('this skill calls')).toBe('calls');
    });
    it('"using"', () => {
      expect(classifyRef('using this')).toBe('calls');
    });
    it('"invokes"', () => {
      expect(classifyRef('it invokes the handler')).toBe('calls');
    });
    it('"step" + "run"', () => {
      expect(classifyRef('step 1 run the command')).toBe('calls');
    });
  });

  describe('suggests', () => {
    it('"suggest"', () => {
      expect(classifyRef('suggest running this')).toBe('suggests');
    });
    it('"next step"', () => {
      expect(classifyRef('next step is to do')).toBe('suggests');
    });
    it('"next:"', () => {
      expect(classifyRef('next: run this')).toBe('suggests');
    });
    it('"then run"', () => {
      expect(classifyRef('then run the skill')).toBe('suggests');
    });
    it('"guide" + "run"', () => {
      expect(classifyRef('guide the user to run this')).toBe('suggests');
    });
  });

  describe('references (default)', () => {
    it('unmatched context', () => {
      expect(classifyRef('see also for more info')).toBe('references');
    });
    it('empty string', () => {
      expect(classifyRef('')).toBe('references');
    });
  });
});
