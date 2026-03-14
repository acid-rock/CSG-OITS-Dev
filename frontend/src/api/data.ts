/* change the any utitlity type based on the data object*/
export default function (data: any) {
  try {
    const response = await fetch(`${API_URL}/get/data`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) throw new Error(response.error);

    const data = await response.json();

    return data;
  } catch (error) {
    /* throw the error to the tsx file and render the error using component or console it*/
    throw error;
  }
}
