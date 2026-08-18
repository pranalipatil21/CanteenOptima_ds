/**
 * Job Scheduling with Deadlines - State Generator
 * @param {Array} jobs - Array of { id, profit, deadline }
 * @returns {Array} states
 */
export function generateJobSchedulingStates(jobs) {
  const states = [];
  
  // Sort jobs by profit descending
  const sortedJobs = [...jobs].sort((a, b) => b.profit - a.profit);
  
  // Find max deadline to size the timeline
  const maxDeadline = Math.max(...jobs.map(j => j.deadline), 0);
  const slots = new Array(maxDeadline).fill(null);
  
  const recordState = (msg, currentJob, checkingSlot, slotUpdated) => {
    states.push({
      log: msg,
      jobs: sortedJobs.map(j => ({...j})), // keep order
      slots: [...slots],
      currentJob,
      checkingSlot,
      slotUpdated
    });
  };

  recordState(`Initialization: Sorted jobs by profit descending. Max deadline is ${maxDeadline}.`, null, null, false);

  for (let i = 0; i < sortedJobs.length; i++) {
    const job = sortedJobs[i];
    recordState(`Processing Job ${job.id} (Profit: ${job.profit}, Deadline: ${job.deadline}). Looking for a free slot from t=${job.deadline} downwards.`, job, null, false);
    
    let scheduled = false;
    // Iterate from deadline - 1 down to 0
    for (let j = Math.min(maxDeadline, job.deadline) - 1; j >= 0; j--) {
      recordState(`Checking if slot [${j} - ${j+1}] is free for Job ${job.id}...`, job, j, false);
      
      if (slots[j] === null) {
        slots[j] = job;
        scheduled = true;
        recordState(`Slot [${j} - ${j+1}] is free! Scheduled Job ${job.id}.`, job, j, true);
        break;
      } else {
        recordState(`Slot [${j} - ${j+1}] is occupied by Job ${slots[j].id}. Moving to earlier slot.`, job, j, false);
      }
    }
    
    if (!scheduled) {
      recordState(`Could not find a free slot for Job ${job.id} before its deadline. Job rejected.`, job, null, false);
    }
  }

  const totalProfit = slots.filter(j => j !== null).reduce((sum, j) => sum + j.profit, 0);
  recordState(`Algorithm finished. Total Profit: ${totalProfit}`, null, null, false);

  return states;
}
