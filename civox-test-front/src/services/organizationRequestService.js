export function submitOrganizationRequest(formData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Organization request submitted successfully.",
      });
    }, 1000);
  });
}