const uploadFileToStorage = async (uploadUrl, file) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
};

export const completePresignedUpload = async (apiResponse, file) => {
  const responseData = await apiResponse.clone().json();
  if (responseData.uploadUrl) await uploadFileToStorage(responseData.uploadUrl, file);
  return apiResponse;
};