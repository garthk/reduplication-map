# Reduplication Map of Australia

Planning a road trip? This **Reduplication Map of Australia** shows around a hundred *[reduplicated][LORAPC]* locality names and aliases from the [PSMA G-NAF][G-NAF] dataset, a comprehensive list of Australian addresses available from [`data.gov.au`][dgaugnaf] on the condition that you don't attempt to use it to send physical mail unless you have some other means to verify you're not wasting Australia Post's time.

The raw data is ~6GB raw, so I'm not decoding it live to produce the feature collection. Sorry! If it helps, the map is based on the `AUG17_GNAF_PipeSeparatedValue_20170821153434` release.

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/garthk/reduplication-map)

[LORAPC]: https://en.wikipedia.org/wiki/List_of_reduplicated_Australian_place_names
[G-NAF]: https://www.psma.com.au/products/g-naf
[dgaugnaf]: https://data.gov.au/dataset/geocoded-national-address-file-g-naf

## Trying it Locally

Got Node?

    npm install
    npm start

Got Python?

    cd public
    python -m SimpleHTTPServer
