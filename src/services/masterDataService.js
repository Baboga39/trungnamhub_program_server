/**
 * Master Data Service for Common Programs and Locations.
 */

const COMMON_PROGRAMS = [
  { code: "NGHI_LE", name: "Nghi lễ" },
  { code: "GIAO_SU", name: "Giáo sử" },
  { code:
  "GIAO_LY", name: "Giáo lý" },
  { code: "GIAO_LUAN", name: "Giáo luận" },
  { code: "SINH_HOAT_CHUNG", name: "Sinh hoạt chung" },
  { code: "TRO_CHOI", name: "Trò chơi" },
  { code: "CHAO_CONG", name: "Chào cờ" },
  { code: "KHAC", name: "Khác" },
];

const LOCATIONS = [
  { code: "TRAI_DUONG", name: "Trai Đường" },
  { code: "BAO_AN_DUONG", name: "Báo Ân Đường" },
  { code: "VAN_PHONG_BHD", name: "Văn phòng BHD" },
  { code: "HOI_TRUONG", name: "Hội trường" },
  { code: "SAN", name: "Sân" },
  { code: "KHAC", name: "Khác" },
];

function getCommonPrograms() {
  return COMMON_PROGRAMS;
}

function getLocationList() {
  return LOCATIONS;
}

function getCommonProgramByCode(code) {
  if (!code) return null;
  const found = COMMON_PROGRAMS.find((p) => p.code === code);
  return found || { code, name: code };
}

function getLocationByCode(code) {
  if (!code) return null;
  const found = LOCATIONS.find((l) => l.code === code);
  return found || { code, name: code };
}

module.exports = {
  getCommonPrograms,
  getLocationList,
  getCommonProgramByCode,
  getLocationByCode,
};
