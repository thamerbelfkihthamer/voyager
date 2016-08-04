var VOYAGER;

(function($) {
    VOYAGER = {
        strings: {},
        content: {},
        orgs: [],
        categories: [],

        // Currently active field
        org: null,
        category: null,
        language: null,

        init: function() {
            // Initialize local storage
            chrome.storage.local.get([
                "language"
            ], function(data) {
                if (data.hasOwnProperty("language")) {
                    VOYAGER.language = data["language"];
                } else {
                    VOYAGER.setLanguage("en");
                }
            });

            // Rendered template response handler
            window.addEventListener("message", function(event) {
                switch (event.data.templateName) {
                case "template_main":
                    VOYAGER.showMain(event.data.result);
                    break;
                }
            });

            $.getJSON("/data/generated.json", function(data) {
                VOYAGER.strings = data.strings;
                VOYAGER.content = data.content;
                VOYAGER.orgs = data.orgs;
                VOYAGER.categories = data.categories;

                VOYAGER.refreshUI();
            });

        },
        
        setLanguage: function(lang, callback) {
            VOYAGER.language = lang;
            chrome.storage.local.set({
                "language": VOYAGER.language
            }, callback);
        },

        getContent: function(org, category, language) {
            return VOYAGER.content;
        },

        refreshUI: function() {
            var content = VOYAGER.getContent(VOYAGER.org, VOYAGER.category,
                VOYAGER.language);
            var context = {
                "strings": VOYAGER.strings[VOYAGER.language],
                "orgs": VOYAGER.orgs,
                "categories": VOYAGER.categories,

                "org": VOYAGER.org,
                "category": VOYAGER.category,
                "lang": VOYAGER.language,
                "content": content
            };
            var message = {
                command: "render",
                templateName: "template_main",
                context: context
            };
            document.getElementById("templates").contentWindow.postMessage(message, "*");
        },

        showMain: function(rendered) {
            $("#content").html(rendered);

            // Language click handler
            $(".lang").on("click", function(e) {
                // Strip off "lang_" prefix from id and use it to set language
                VOYAGER.setLanguage(e.target.id.substring(5), function() {
                    VOYAGER.refreshUI();
                });
            });
        }
    };
})(jQuery);

jQuery(function($) {
    $("#templates").load(function() {
        VOYAGER.init();
    });
});
