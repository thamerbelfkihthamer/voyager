var VOYAGER;

(function($) {
    VOYAGER = {
        strings: {},
        content: {},
        orgs: [],
        orgsObj: {},
        categories: [],
        categoriesObj: {},

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
                case "template_navbar":
                    VOYAGER.showNavbar(event.data.result);
                    break;
                }
            });

            $.getJSON("/data/generated.json", function(data) {
                VOYAGER.strings = data.strings;
                VOYAGER.content = VOYAGER.transformContent(data.content);
                VOYAGER.orgs = data.orgs;
                VOYAGER.categories = data.categories;

                for (var i = 0; i < VOYAGER.orgs.length; i++) {
                    var org = VOYAGER.orgs[i];
                    VOYAGER.orgsObj[org.name] = org;
                }
                for (var i = 0; i < VOYAGER.categories.length; i++) {
                    var category = VOYAGER.categories[i];
                    VOYAGER.categoriesObj[category.name] = category;
                }

                VOYAGER.refreshUI();
            });

        },

        sendMessage: function(message) {
            document.getElementById("templates").contentWindow
                .postMessage(message, "*");
        },

        setLanguage: function(lang, callback) {
            VOYAGER.language = lang;
            chrome.storage.local.set({
                "language": VOYAGER.language
            }, callback);
        },

        getContent: function() {
            // TODO(ejpark): Implement filtering of content based on input
            // parameters
            var filteredContent = [];
            if (VOYAGER.language === undefined || VOYAGER.language === null) {
                VOYAGER.language == "en";
            }

            if (VOYAGER.category != null && VOYAGER.org != null) {
                for (var element in VOYAGER.content) {

                    if (VOYAGER.content[element]["lang_support"][VOYAGER.language] &&
                        VOYAGER.content[element]["categories"].indexOf(VOYAGER.category.name) >= 0 &&
                        VOYAGER.content[element]["org"] === VOYAGER.org.name) {
                       filteredContent.push(VOYAGER.content[element]);
                    }
                }
            }

            return filteredContent;
        },

        refreshUI: function() {
            var context = {
                "lang": VOYAGER.language,
                "org": VOYAGER.org,
                "category": VOYAGER.category,
                "content": VOYAGER.getContent()
            };

            var message = {
                command: "render",
                templateName: "template_main",
                context: context
            };
            VOYAGER.sendMessage(message);

        },

        showNavbar: function(rendered) {
            $("#main_navbar").html(rendered);

            // Dropdown click handler
            $("#orgs_label").on("click", function(e) {
                if ($("#categories_menu").css("display") != "none") {
                    $("#categories_menu").slideUp("fast", function() {
                        $("#orgs_menu").slideDown("fast");
                    });
                } else {
                    $("#orgs_menu").slideToggle("fast");
                }
            });

            $("#categories_label").on("click", function(e) {
                if ($("#orgs_menu").css("display") != "none") {
                    $("#orgs_menu").slideUp("fast", function() {
                        $("#categories_menu").slideDown("fast");
                    });
                } else {
                    $("#categories_menu").slideToggle("fast");
                }
            });

            $("#navigation .home-label").on("click", function(e) {
                VOYAGER.org = null;
                VOYAGER.category = null;
                VOYAGER.refreshUI();
            });

            // Organization click handler
            $(".org").on("click", function(e) {
                // Strip off "org_" prefix from id
                VOYAGER.org = VOYAGER.orgsObj[e.target.id.substring(4)];
                VOYAGER.refreshUI();
            });

            // Category click handler
            $(".category").on("click", function(e) {
                // Strip off "category_" prefix from id
                VOYAGER.category = VOYAGER.categoriesObj[e.target.id.substring(9)];
                VOYAGER.refreshUI();
            });

            // Language click handler
            $("#languages div").on("click", function(e) {
                // Strip off "lang_" prefix from id
                VOYAGER.setLanguage(e.target.id.substring(5), function() {
                    VOYAGER.refreshUI();
                });
            });
        },

        showMain: function(rendered) {
            $("#content").html(rendered);

            // Load all the images
            $("img.load-image").each(function() {
                VOYAGER.loadImage($(this).attr('id'));
            });

            // Organize the loaded images into two columns
            $("#cards-container img").on('load', function() {
                $("#cards-container").masonry({
                    itemSelector: ".card",
                    columnWidth: ".card",
                    gutter: 10,
                    columns: 2
                });
            });

            var context = {
                "strings": VOYAGER.strings[VOYAGER.language],
                "orgs": VOYAGER.orgs,
                "categories": VOYAGER.categories,

                "org": VOYAGER.org,
                "category": VOYAGER.category,
                "lang": VOYAGER.language
            };

            var message = {
                command: "render",
                templateName: "template_navbar",
                context: context
            };
            VOYAGER.sendMessage(message);
        },

        transformContent: function(content) {
            for (var i = 0; i < content.length; i++) {
                if (content[i].type == "video") {
                    content[i].youtube_id = VOYAGER.extractYoutubeId(content[i].url);
                }
            }
            return content;
        },

        extractYoutubeId: function(url) {
            var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            var match = url.match(regExp);

            if (match && match[2].length == 11) {
            return match[2];
            } else {
            return 'error';
            }
        },

        loadImage: function(imgId) {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = function() {
                document.getElementById(imgId).src = window.URL.createObjectURL(xhr.response);
            }
            xhr.open('GET', $("#" + imgId).attr('data-src'), true);
            xhr.send();
        }
    };
})(jQuery);

jQuery(function($) {
    $("#templates").load(function() {
        VOYAGER.init();
    });
});
