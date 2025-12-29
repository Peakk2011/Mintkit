/**
 * Performance calculation utilities
 */
export const PerformanceCalculator = {
    /**
     * Calculate average from array of numbers
     * @param {number[]} numbers - Array of numbers
     * @returns {number} Average value
     */
    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    },

    /**
     * Calculate percentile from array of numbers
     * @param {number[]} numbers - Array of numbers
     * @param {number} percentile - Percentile (0-100)
     * @returns {number} Percentile value
     */
    calculatePercentile(numbers, percentile) {
        if (numbers.length === 0) return 0;
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    },

    /**
     * Calculate success rate
     * @param {number} successful - Successful count
     * @param {number} total - Total count
     * @returns {number} Success rate percentage
     */
    calculateSuccessRate(successful, total) {
        if (total === 0) return 100;
        return (successful / total) * 100;
    },

    /**
     * Calculate error rate
     * @param {number} failed - Failed count
     * @param {number} total - Total count
     * @returns {number} Error rate percentage
     */
    calculateErrorRate(failed, total) {
        if (total === 0) return 0;
        return (failed / total) * 100;
    }
};