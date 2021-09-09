// prettier-ignore
export const enum PERMISSONS {
    CHANGEOWNER   = 0x01,   // 0000 0001
    CHANGEKEYS    = 0x02,   // 0000 0010
    SETDATA       = 0x04,   // 0000 0100
    CALL          = 0x08,   // 0000 1000
    DELEGATECALL  = 0x10,   // 0001 0000
    DEPLOY        = 0x20,   // 0010 0000
    TRANSFERVALUE = 0x40,   // 0100 0000
    SIGN          = 0x80,   // 1000 0000
}
