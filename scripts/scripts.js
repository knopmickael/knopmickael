const flushSkillInfo = () => stackinfo.innerHTML = "";

const handleActiveMenu = (current, next) => {
    if (current != null && current.length == 0) current = 'home';
    if (current == null || current == 'undefined') current = 'home';
    if (next.length == 0) next = 'home';
    currentActiveId = current == 'Link' ? 'homeLink' : current + 'Link';
    toActivateId = next == 'Link' ? 'homeLink' : next + 'Link';
    let currentActiveLink = document.getElementById(currentActiveId);
    let toActivateLink = document.getElementById(toActivateId);
    let activateClasses = ['translate-x-2', 'scale-125', 'opacity-80'];
    currentActiveLink.classList.remove('translate-x-2', 'scale-125', 'opacity-80');
    toActivateLink.classList.add('translate-x-2', 'scale-125', 'opacity-80');
};

const toggleSkill = (skill) => {
    let skills = [
        {
            "name": "PHP",
            "content": "PHP is a popular general-purpose scripting language that is especially suited to web development."
        },
        {
            "name": "Slim",
            "content": "Slim is a PHP micro framework that helps you quickly write simple yet powerful web applications and APIs."
        },
        {
            "name": "Laravel",
            "content": "Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things."
        },
        {
            "name": "MySQL",
            "content": "MySQL Database Service is a fully managed database service to deploy cloud-native applications. HeatWave, an integrated, high-performance query accelerator boosts MySQL performance by 5400x."
        },
        {
            "name": "JavaScript",
            "content": "JavaScript is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions."
        },
        {
            "name": "AngularJS",
            "content": "AngularJS is a toolset for building the framework most suited to your application development. It is fully extensible and works well with other libraries."
        },
        {
            "name": "Vue.js",
            "content": "Vue.js is a progressive framework for building user interfaces. Unlike other monolithic frameworks, Vue is designed from the ground up to be incrementally adoptable."
        },
        {
            "name": "Node.js",
            "content": "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine."
        },
        {
            "name": "Express",
            "content": "Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications."
        },
        {
            "name": "MongoDB",
            "content": "MongoDB is a free, open-source, cross-platform document-oriented database software written in the C++ language. Classified as a NoSQL database program, MongoDB uses JSON-like documents with schemas."
        }
    ];
    skills.forEach(s => {
        if (s.name == skill) {
            let stackinfo = document.getElementById('stackinfo');
            stackinfo.innerHTML = s.content;
        }
    });
}

window.addEventListener("load", function(e) {
    handleActiveMenu(null, window.location.hash);

    setTimeout(() => {
        setTimeout(() => {
            let profileImage = document.getElementById("profileImage");
                profileImage.classList.add("h-44", "lg:h-52", "xl:h-64", "2xl:h-96");
            setTimeout(() => {
                let fullName = document.getElementById("fullName");
                    fullName.classList.add("opacity-100");
                let role = document.getElementById("role");
                    role.classList.add("opacity-100");
                setTimeout(() => {
                    let navigationBar = document.getElementById("navigationBar");
                        navigationBar.classList.remove("-translate-x-20");
                }, 500);
            }, 500);
        }, 500);
    }, 500);
});

window.addEventListener("scroll", function(e) {
    let aboutSection = document.getElementById("about");
    let skillsSection = document.getElementById("skills");
    let projectsSection = document.getElementById("projects");
    let contactSection = document.getElementById("contact");

    if (isScrolledIntoView(aboutSection)) {
        let aboutSectionTitle = aboutSection.children[0];
        let aboutSectionDescribe = aboutSection.children[1];
        setTimeout(() => {
            aboutSectionTitle.classList.remove("translate-x-10");
            aboutSectionDescribe.classList.remove("translate-x-10");
            setTimeout(() => {
                aboutSectionTitle.classList.remove("opacity-0");
                aboutSectionDescribe.classList.remove("opacity-0");
            }, 250);
        }, 500);
    }

    if (isScrolledIntoView(skillsSection)) {
        let skillsSectionTitle = skillsSection.children[0];
        let skillsSectionSkills = skillsSection.children[1];
        setTimeout(() => {
            skillsSectionTitle.classList.remove("translate-x-10");
            skillsSectionSkills.classList.remove("translate-x-10");
            setTimeout(() => {
                skillsSectionTitle.classList.remove("opacity-0");
                skillsSectionSkills.classList.remove("opacity-0");
            }, 250);
        }, 500);
    }

    if(isScrolledIntoView(projectsSection)) {
        let projectsSectionTitle = projectsSection.children[0];
        let projectsSectionProjects = projectsSection.children[1];
        setTimeout(() => {
            projectsSectionTitle.classList.remove("translate-x-10");
            projectsSectionProjects.classList.remove("translate-x-10");
            setTimeout(() => {
                projectsSectionTitle.classList.remove("opacity-0");
                projectsSectionProjects.classList.remove("opacity-0");
            }, 250);
        }, 500);
    }

    if(isScrolledIntoView(contactSection)) {
        let contactSectionTitle = contactSection.children[0];
        let contactSectionIcons = contactSection.children[1];
        setTimeout(() => {
            contactSectionTitle.classList.remove("translate-x-10");
            contactSectionIcons.classList.remove("translate-x-10");
            setTimeout(() => {
                contactSectionTitle.classList.remove("opacity-0");
                contactSectionIcons.classList.remove("opacity-0");
            }, 250);
        }, 500);
    }

    function isScrolledIntoView(el) {
        if (el != null) {
            var rect = el.getBoundingClientRect();
            var elemTop = rect.top;
            var elemBottom = rect.bottom;
            var isVisible = elemTop < window.innerHeight && elemBottom >= 0;
            return isVisible;
        }
    }  
});

window.addEventListener('hashchange', function(e) {
    let currentActiveId = e.oldURL.split('#')[1];
    let toActivateId = e.newURL.split('#')[1];
    if (currentActiveId == null || currentActiveId == 'undefined')
        handleActiveMenu(null, toActivateId);
    else handleActiveMenu(currentActiveId, toActivateId);
});