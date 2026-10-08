import axios from "@/lib/services/config";

const accessControlReportsServices = {};

accessControlReportsServices.rolesPermissions = async () => {
  const { data } = await axios.get(`/api/accessControlReports/rolesPermissions`);
  return data;
}

// PDF is rendered client-side (@react-pdf/renderer); this just records the
// export in the audit trail. Fire-and-forget from the caller — a failure
// here should never block the PDF the user already has on screen.
accessControlReportsServices.markRolesPermissionsPdfExported = async () => {
  await axios.post(`/api/accessControlReports/rolesPermissions/pdf-exported`, {});
}

accessControlReportsServices.usersRoles = async () => {
  const { data } = await axios.get(`/api/accessControlReports/usersRoles`);
  return data;
}

accessControlReportsServices.markUsersRolesPdfExported = async () => {
  await axios.post(`/api/accessControlReports/usersRoles/pdf-exported`, {});
}

accessControlReportsServices.approvalChains = async () => {
  const { data } = await axios.get(`/api/accessControlReports/approvalChains`);
  return data;
}

accessControlReportsServices.markApprovalChainsPdfExported = async () => {
  await axios.post(`/api/accessControlReports/approvalChains/pdf-exported`, {});
}

export default accessControlReportsServices;
