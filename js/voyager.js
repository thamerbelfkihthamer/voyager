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
                VOYAGER.content = VOYAGER.transformContent(data.content);
                VOYAGER.orgs = data.orgs;
                VOYAGER.categories = data.categories;

                VOYAGER.refreshUI();
            });

            // Video click handler
            VOYAGER.registerVideoLinkHandlers();
        },

        setLanguage: function(lang, callback) {
            VOYAGER.language = lang;
            chrome.storage.local.set({
                "language": VOYAGER.language
            }, callback);
        },

        getContent: function(org, category, language) {
            // TODO(ejpark): Implement filtering of content based on input
            // parameters
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
        },

        registerVideoLinkHandlers: function() {
            $("body").on("click", ".video-link", function() {
                $(".video-modal-content").empty().html('<webview class="embedded-video" src="' 
                    + $(this).attr("data-url") + '"></webview>');
                $(".video-modal-content").append('<span class="close">×</span>');
                $(".video-modal").show();
            });

            $("body").on("click", ".video-modal-content .close, .video-modal", function() {
                $(".video-modal").hide();
            });
        }
    };
})(jQuery);

jQuery(function($) {
    $("#templates").load(function() {
        VOYAGER.init();
    });
});
