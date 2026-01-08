#!/usr/bin/env node
/**
 * UAT Reminder Script
 *
 * Runs after git commits to remind about requesting UAT before closing issues.
 * Checks current branch for issue ID and verifies UAT status.
 *
 * Usage: Called by PostToolUse hook after git commit commands
 */

import { execSync } from 'child_process';

/**
 * Get current git branch name
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Extract issue ID from branch name
 * Expects format: <type>/<issue-id>-description
 * Example: feature/project-template-abc-add-dark-mode
 */
function extractIssueId(branchName) {
  if (!branchName || branchName === 'main' || branchName === 'master') {
    return null;
  }

  // Match pattern: anything/project-template-XXX or beads-XXX
  const match = branchName.match(/(project-template-[a-z0-9]+|beads-[a-z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Check if issue has UAT labels
 */
function checkUatStatus(issueId) {
  try {
    const output = execSync(`bd show ${issueId} --json 2>/dev/null`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const issue = JSON.parse(output);
    const labels = issue.labels || [];

    return {
      hasRequested: labels.includes('uat:requested'),
      hasApproved: labels.includes('uat:approved'),
      hasDenied: labels.includes('uat:denied'),
      hasAnyUat: labels.some(l => l.startsWith('uat:'))
    };
  } catch {
    return null;
  }
}

/**
 * Main entry point
 */
function main() {
  const branch = getCurrentBranch();
  if (!branch) return;

  const issueId = extractIssueId(branch);
  if (!issueId) return;

  const uatStatus = checkUatStatus(issueId);
  if (!uatStatus) return;

  // If no UAT labels, remind user
  if (!uatStatus.hasAnyUat) {
    console.log('');
    console.log('=== UAT REMINDER ===');
    console.log(`Issue: ${issueId}`);
    console.log('');
    console.log('Work committed. Before closing this issue:');
    console.log('  1. Request UAT: /uat request <feature-name>');
    console.log('  2. Wait for approval: /uat approve <feature-name>');
    console.log('');
    console.log('=== END REMINDER ===');
    console.log('');
  } else if (uatStatus.hasRequested && !uatStatus.hasApproved) {
    console.log('');
    console.log('=== UAT STATUS ===');
    console.log(`Issue ${issueId} has UAT requested.`);
    console.log('Waiting for human approval via: /uat approve <feature-name>');
    console.log('=== END STATUS ===');
    console.log('');
  } else if (uatStatus.hasDenied) {
    console.log('');
    console.log('=== UAT STATUS ===');
    console.log(`Issue ${issueId} UAT was denied.`);
    console.log('Fix issues and re-request: /uat request <feature-name>');
    console.log('=== END STATUS ===');
    console.log('');
  }
}

main();
