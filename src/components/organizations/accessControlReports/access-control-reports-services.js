import axios from "@/lib/services/config";

const accessControlReportsServices = {};

accessControlReportsServices.rolesPermissions = async () => {
  const { data } = await axios.get(`/api/accessControlReports/rolesPermissions`);
  return data;
}

accessControlReportsServices.downloadPdfRolesPermissions = async () => {
  const { data } = await axios.post(`/api/accessControlReports/rolesPermissions/pdf`, {}, {
    responseType: 'blob',
  });
  return data;
}

accessControlReportsServices.usersRoles = async () => {
  const { data } = await axios.get(`/api/accessControlReports/usersRoles`);
  return data;
}

accessControlReportsServices.downloadPdfUsersRoles = async () => {
  const { data } = await axios.post(`/api/accessControlReports/usersRoles/pdf`, {}, {
    responseType: 'blob',
  });
  return data;
}

accessControlReportsServices.approvalChains = async () => {
  const { data } = await axios.get(`/api/accessControlReports/approvalChains`);
  return data;
}

accessControlReportsServices.downloadPdfApprovalChains = async () => {
  const { data } = await axios.post(`/api/accessControlReports/approvalChains/pdf`, {}, {
    responseType: 'blob',
  });
  return data;
}

export default accessControlReportsServices;
