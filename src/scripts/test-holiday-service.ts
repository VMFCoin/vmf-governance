/**
 * Test script for Holiday Proposal Service
 * This demonstrates the Phase 16.4 functionality
 */

import { holidayProposalService } from '../services/holidayProposalService';
import { notificationService } from '../services/notificationService';

export async function testHolidayService() {
  console.log('🎖️ Testing VMF Holiday Proposal Service - Phase 16.4');
  console.log('='.repeat(60));

  // 1. Test service status
  console.log('\n1. Service Status:');
  const status = holidayProposalService.getStatus();
  console.log(`   Running: ${status.isRunning}`);
  console.log(`   Holidays tracked: ${status.nextHolidays.length}`);

  // 2. Show upcoming holidays
  console.log('\n2. Upcoming Holidays (2025):');
  status.nextHolidays.forEach(item => {
    const statusIcon = item.hasProposal
      ? '✅'
      : item.needsProposal
        ? '⚠️'
        : '⏳';
    console.log(
      `   ${statusIcon} ${item.holiday.flagIcon} ${item.holiday.name}`
    );
    console.log(`      Date: ${item.holiday.date.toDateString()}`);
    console.log(`      Days until: ${item.daysUntil}`);
    console.log(`      Fund: $${item.holiday.fundAllocation.toLocaleString()}`);
    console.log(
      `      Proposal trigger: ${item.proposalTriggerDate.toDateString()}`
    );
    console.log(`      Has proposal: ${item.hasProposal}`);
    console.log(`      Needs proposal: ${item.needsProposal}`);
    console.log('');
  });

  // 3. Test manual proposal generation
  console.log('\n3. Testing Manual Proposal Generation:');
  try {
    // Try to generate a proposal for Veterans Day
    const success =
      await holidayProposalService.generateProposalForHoliday('veterans-day');
    console.log(
      `   Veterans Day proposal generation: ${success ? '✅ Success' : '❌ Failed'}`
    );
  } catch (error) {
    console.log(`   Veterans Day proposal generation: ❌ Error - ${error}`);
  }

  // 4. Test service start/stop
  console.log('\n4. Testing Service Control:');
  console.log('   Starting service...');
  holidayProposalService.start();
  console.log(
    `   Service running: ${holidayProposalService.getStatus().isRunning}`
  );

  console.log('   Stopping service...');
  holidayProposalService.stop();
  console.log(
    `   Service running: ${holidayProposalService.getStatus().isRunning}`
  );

  // 5. Test notifications
  console.log('\n5. Testing Notifications:');
  const notifications = notificationService.getNotifications();
  console.log(`   Total notifications: ${notifications.length}`);
  console.log(
    `   Unread notifications: ${notificationService.getUnreadCount()}`
  );

  if (notifications.length > 0) {
    console.log('   Recent notifications:');
    notifications.slice(0, 3).forEach(notif => {
      console.log(`     📢 ${notif.title}`);
      console.log(`        ${notif.message}`);
      console.log(`        ${notif.timestamp.toLocaleString()}`);
    });
  }

  // 6. Test holiday data
  console.log('\n6. Holiday Data Summary:');
  console.log('   2025 VMF Holidays:');
  status.nextHolidays.forEach(item => {
    console.log(
      `   • ${item.holiday.name} - ${item.holiday.date.toDateString()} - $${item.holiday.fundAllocation.toLocaleString()}`
    );
  });

  console.log('\n🎉 Phase 16.4 Test Complete!');
  console.log('='.repeat(60));
}

// Export for use in components
export default testHolidayService;
