fx_version 'cerulean'
games { 'gta5' }
author 'dhanione'
description 'Dhani Zuma Ball Minigame'
version '1.0.0'
lua54 'yes'
shared_scripts {
    '@ox_lib/init.lua',
    '@qbx_core/shared/locale.lua',   
    '@qbx_core/modules/lib.lua',
}
client_scripts {
    '@qbx_core/modules/playerdata.lua',
    'config.lua',
    'client/*.lua',
}
server_scripts {
    '@oxmysql/lib/MySQL.lua',
}

ui_page 'web/index.html'

files {
     'web/*.html',
     'web/*.js',
     'web/*.css',
}

dependencies {
    '/server:7290',
    '/onesync',
    '/assetpacks',
}