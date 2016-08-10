#!/usr/bin/python
#
# Generate generated.json file used by Voyager Chrome app
#
# Usage:
# python generator.py <content csv file> <appdata json file> <output json file>
#
# content csv file - CSV export of content tracker spreadsheet
# app data json file - JSON file containing localized strings, orgs, and
#                      categories
#

import csv
import json
import sys

EXPECTED_LANGUAGES = ['ar', 'de', 'en']
EXPECTED_LABELS = ['strings', 'orgs', 'categories']

CATEGORIES = {
    "Agriculture": "agriculture",
    "Architecture": "architecture",
    "BCI": "bci",
    "Brain Computer Interface": "bci",
    "Cars": "cars",
    "Coding": "coding",
    "Comics": "comics",
    "Culinary": "culinary",
    "Design and Art": "design_art",
    "Education": "education",
    "Environmental": "environmental",
    "Game Design": "game_design",
    "Games": "games",
    "Graphic Design": "graphics_design",
    "Language": "language",
    "Math and Science": "math_science",
    "Professional Development": "professional",
    "Robotics": "robotics",
    "Space": "space",
    "Technology": "technology",
    "Vocational and Trade Skills": "vocational",
}

# Returns true if all expected languages are present in object
def isExpectedLangsPresent(src_obj, label):
    present = sorted(src_obj.keys()) == sorted(EXPECTED_LANGUAGES)
    if not present:
        print "Missing expected language for", label
        print "Expected:", sorted(EXPECTED_LANGUAGES)
        print "Found:   ", sorted(src_obj.keys())
    return present

# Validate categories and orgs data
def isValid(src_list, label):
    for entry in src_list:
        if not "name" in entry:
            print "Missing name field in", label
            return False
        elif not "title" in entry:
            print "Missing title field in", label, "for name", entry["name"]
        elif not isExpectedLangsPresent(entry["title"], \
                                        label + "/" + entry["name"]):
            return False

    return True

# Ensure all expected languages are present for each strings entry
def isLangsValidForStrings(src_obj):
    for entry in src_obj.keys():
        if not isExpectedLangsPresent(src_obj[entry], "strings/" + entry):
            return False
    return True

# Regroup strings by language then by string name
def generateStrings(data):
    output = {}
    for lang in EXPECTED_LANGUAGES:
        output[lang] = {}
        for name in data.keys():
            output[lang][name] = data[name][lang]
    return output

# Input:  Path to appdata.json file
# Output: Dict containing strings, categories, and orgs data
def parseAppdataFile(file_path):
    data = {}
    with open(file_path, "r") as f:
        data = json.load(f)

    output = {}
    for label in EXPECTED_LABELS:
        # Verify label is present
        if not label in data:
            print "Missing", label, "data"
            return None

        # Verify expected languages are present
        if label == "strings" and isLangsValidForStrings(data["strings"]):
            output["strings"] = generateStrings(data["strings"])
        elif isValid(data[label], label):
            output[label] = data[label]

    return output

def contentURL(url):
    url = url.strip()
    # TODO(ejpark): Add youtube URL sanitization and return URL as dict per lang
    return url

def contentCategories(categories):
    ctypes = [c.strip() for c in categories.split(',')]
    output = []
    for ctype in ctypes:
        if ctype in CATEGORIES:
            output.append(CATEGORIES[ctype])
    return output

def contentLangSupport(arabic, german):
    # TODO(ejpark): Fix this
    return {
        "ar": arabic,
        "en": "yes",
        "de": german,
    }

def contentTitle(title):
    title = title.strip()
    return {
        "ar": title,
        "en": title,
        "de": title,
    }

def parseContent(i, fields):
    if fields[8] == "":
        return None
    record = {
        "type": "video",
        "categories":   contentCategories(fields[4]),
        "lang_support": contentLangSupport(fields[5], fields[6]),
        "title":        contentTitle(fields[7]),
        "url":          contentURL(fields[8]),
        "author":       fields[9].strip(),
        "logo":         fields[10].strip(),
        "duration":     fields[11].strip(),
    }
    return record

def parseContentFile(file_path):
    content = []
    with open(file_path, "r") as f:
        csvreader = csv.reader(f)
        for i, line in enumerate(csvreader):
            if i <= 1:
                continue
            record = parseContent(i, line)
            if not record:
                print "Parse error, skpping line %d:\n%s\n" % (i, line)
                continue
            content.append(record)

    return {"content" : content}

def main():
    if len(sys.argv) != 4:
        print "Usage:", sys.argv[0], "<content csv file> <appdata json file> <output json file>"
        return

    # Generate strings, categories, and orgs data
    output = parseAppdataFile(sys.argv[2])
    if not output:
        return

    # Generate content data
    content = parseContentFile(sys.argv[1])
    output.update(content)

    of = open(sys.argv[3], "w")
    json.dump(output, of, indent=4, separators=(',', ': '))

if __name__ == "__main__":
    main()
