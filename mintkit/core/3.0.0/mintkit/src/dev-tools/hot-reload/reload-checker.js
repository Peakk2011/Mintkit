/**
 * Check if reload is needed from server response
 * @param {Object} data - Server response data
 * @returns {boolean} True if reload is needed
 */
export function checkReloadNeeded(data) {
    return data && data.reload === true;
}