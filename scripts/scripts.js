window.addEventListener("load", function(event) {
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

window.addEventListener("scroll", function() {
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
        var rect = el.getBoundingClientRect();
        var elemTop = rect.top;
        var elemBottom = rect.bottom;
        var isVisible = elemTop < window.innerHeight && elemBottom >= 0;
        return isVisible;
    }  
});

// function showInfo(curSkill) {
//     var curSkillInfoBox = document.getElementById("curSkillInfoBox");

//     switch(curSkill) {
//         case "laravel":
//             curSkillInfoBox.classList.add("-translate-y-10", "opacity-0")
//             setTimeout(() => {
//                 curSkillInfoBox.innerHTML = "<h2 class=\"font-bold 2xl:mt-8 2xl:text-4xl 2xl:mb-4\">Laravel</h2><p class=\"2xl:text-3xl 2xl:leading-loose 2xl:mx-72\">Laravel é um framework PHP full-stack criado para o desenvolvimento de sistemas web que utilizam o padrão MVC.</p>";
//                 curSkillInfoBox.classList.remove("-translate-y-10", "opacity-0")
//             }, 500);
//             break;
//         case "vue":
//             curSkillInfoBox.classList.add("-translate-y-10", "opacity-0")
//             setTimeout(() => {
//                 curSkillInfoBox.innerHTML = "<h2 class=\"font-bold 2xl:mt-8 2xl:text-4xl 2xl:mb-4\">Vue.js</h2><p class=\"2xl:text-3xl 2xl:leading-loose 2xl:mx-72\">Vue.js é um framework JavaScript focado no desenvolvimento de interfaces de usuário e aplicativos de página única.</p>";
//                 curSkillInfoBox.classList.remove("-translate-y-10", "opacity-0")
//             }, 500);
//             break;
//         case "tailwind":
//             curSkillInfoBox.classList.add("-translate-y-10", "opacity-0")
//             setTimeout(() => {
//                 curSkillInfoBox.innerHTML = "<h2 class=\"font-bold 2xl:mt-8 2xl:text-4xl 2xl:mb-4\">Tailwind CSS</h2><p class=\"2xl:text-3xl 2xl:leading-loose 2xl:mx-72\">Tailwind CSS é um framework CSS voltado para a construção de páginas amigáveis aplicando conceitos de Utility First.</p>";
//                 curSkillInfoBox.classList.remove("-translate-y-10", "opacity-0")
//             }, 500);
//             break;
//         default:
//             break;
//     }
// }