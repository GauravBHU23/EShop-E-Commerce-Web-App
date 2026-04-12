package com.ecommerce.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class SlugUtil {

    private static final Pattern NON_LATIN     = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE    = Pattern.compile("[\\s]+");
    private static final Pattern MULTI_HYPHEN  = Pattern.compile("-{2,}");

    public static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String slug = normalized
                .toLowerCase(Locale.ENGLISH)
                .replaceAll("[^\\p{ASCII}]", "");
        slug = WHITESPACE.matcher(slug).replaceAll("-");
        slug = NON_LATIN.matcher(slug).replaceAll("");
        slug = MULTI_HYPHEN.matcher(slug).replaceAll("-");
        return slug.trim().replaceAll("^-|-$", "");
    }

    public static String uniqueSlug(String input, String id) {
        return toSlug(input) + "-" + id;
    }
}
