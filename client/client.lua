local function Notify(text, type)
    if Config.UseQBCoreNotify then
        TriggerEvent('QBCore:Notify', text, type or 'primary')
    else
        print("[ZUMA] " .. text)
    end
end

RegisterNUICallback("notify", function(data, cb)
    if data.result == "win" then
        Notify("You won the Zuma minigame!", "success", 8500)
    elseif data.result == "lose" then
        Notify("You failed the Zuma minigame!", "error", 8500)
    end
    SetNuiFocus(false, false)
    cb({})
end)


RegisterCommand("zuma", function()
    local difficulty = Config.DefaultDifficulty
    local spiralCount = Config.DefaultSpiralCount
    local data = Config.Difficulties[difficulty]

    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "open",
        difficulty = difficulty,
        spiralCount = spiralCount,
        spawnCount = data.spawnCount,
        speed = data.speed
    })
end)



RegisterNUICallback("close", function(_, cb)
    SetNuiFocus(false, false)
    cb({})
end)

--example for export
RegisterCommand("testzuma", function()
    exports["dhani_zumagame"]:StartZumaMinigame("easy")
end)


exports('StartZumaMinigame', function(difficulty)
    local spiralCount = Config.DefaultSpiralCount
    local data = Config.Difficulties[difficulty] or Config.Difficulties["easy"]

    SetNuiFocus(true, true)

    local payload = {
        action = "open",
        difficulty = difficulty,
        spiralCount = spiralCount,
        spawnCount = data.spawnCount,
        speed = data.speed
    }

    SendNUIMessage(payload)
end)

